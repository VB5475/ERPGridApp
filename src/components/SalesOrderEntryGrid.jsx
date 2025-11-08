import React, { useState, useEffect, useRef } from 'react';
import DataGrid, {
    Column,
    Editing,
    Lookup,
    RequiredRule,
    Button as GridButton,
    Scrolling,
    Summary,
    TotalItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import 'devextreme/dist/css/dx.light.css';

const SalesOrderEntryGrid = ({ soId }) => {
    const gridRef = useRef(null);
    const saveAllButtonRef = useRef(null);
    const cancelButtonRef = useRef(null);
    const [gridData, setGridData] = useState([]);
    const [mainGroups, setMainGroups] = useState([]);
    const [subMainGroups, setSubMainGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveButtonFocused, setSaveButtonFocused] = useState(false);
    const [cancelButtonFocused, setCancelButtonFocused] = useState(false);

    const [dropdownCache, setDropdownCache] = useState({
        subMainGroups: {},
        items: {},
        units: {}
    });

    useEffect(() => {
        if (soId) {
            fetchInitialData();
        }
    }, [soId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await fetchMainGroups();
            await fetchSalesOrderDetails();
        } finally {
            setLoading(false);
        }
    };

    const fetchMainGroups = async () => {
        const res = await fetch('http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemMainGroup');
        const data = await res.json();
        setMainGroups(data || []);
    };

    const fetchSalesOrderDetails = async () => {
        const res = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderDetail_Select&SOID=${soId}`);
        const data = await res.json();
        setGridData((data || []).map(d => ({ ...d, id: d.SODetID })));
    };

    const fetchSubMainGroups = async (mainGroupId) => {
        if (!mainGroupId) return [];
        if (dropdownCache.subMainGroups[mainGroupId]) {
            setSubMainGroups(dropdownCache.subMainGroups[mainGroupId]);
            return dropdownCache.subMainGroups[mainGroupId];
        }
        const res = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemSubMainGroup&MainGroupID=${mainGroupId}`);
        const data = await res.json();
        setDropdownCache(prev => ({
            ...prev,
            subMainGroups: { ...prev.subMainGroups, [mainGroupId]: data }
        }));
        setSubMainGroups(data);
        return data;
    };

    const fetchItems = async (mainGroupId, subMainGroupId) => {
        if (!mainGroupId || !subMainGroupId) return [];
        const key = `${mainGroupId}_${subMainGroupId}`;
        if (dropdownCache.items[key]) {
            setItems(dropdownCache.items[key]);
            return dropdownCache.items[key];
        }
        const res = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_Item&MainGroupID=${mainGroupId}&SubMianGroupID=${subMainGroupId}`);
        const data = await res.json();
        setDropdownCache(prev => ({
            ...prev,
            items: { ...prev.items, [key]: data }
        }));
        setItems(data);
        return data;
    };

    const fetchUnits = async (itemId) => {
        if (!itemId) return [];
        if (dropdownCache.units[itemId]) {
            setUnits(dropdownCache.units[itemId]);
            return dropdownCache.units[itemId];
        }
        const res = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemUnit&ItemID=${itemId}`);
        const data = await res.json();
        setDropdownCache(prev => ({
            ...prev,
            units: { ...prev.units, [itemId]: data }
        }));
        setUnits(data);
        return data;
    };

    const focusAddButton = () => {
        setTimeout(() => {
            const addButton = document.querySelector('.dx-datagrid-addrow-button');
            if (addButton) {
                addButton.focus();
            }
        }, 100);
    };

    const onEditorPreparing = (e) => {
        if (e.parentType !== 'dataRow') return;

        if (e.dataField === 'MainGroupID') {
            e.editorOptions.onValueChanged = async (args) => {
                const mainGroupId = args.value;
                e.row.data.MainGroupID = mainGroupId;
                e.row.data.SubMainGroupID = null;
                e.row.data.ItemID = null;
                e.row.data.UnitID = null;
                const subGroups = await fetchSubMainGroups(mainGroupId);
                setSubMainGroups(subGroups);
            };
        }

        if (e.dataField === 'SubMainGroupID') {
            e.editorOptions.onValueChanged = async (args) => {
                const subMainGroupId = args.value;
                e.row.data.SubMainGroupID = subMainGroupId;
                e.row.data.ItemID = null;
                e.row.data.UnitID = null;
                const itemsData = await fetchItems(e.row.data.MainGroupID, subMainGroupId);
                setItems(itemsData);
            };
        }

        if (e.dataField === 'ItemID') {
            e.editorOptions.onValueChanged = async (args) => {
                const itemId = args.value;
                e.row.data.ItemID = itemId;
                e.row.data.UnitID = null;
                const unitsData = await fetchUnits(itemId);
                setUnits(unitsData);
            };
        }

        if (e.dataField === 'Rate') {
            const originalOnKeyDown = e.editorOptions.onKeyDown;
            e.editorOptions.onKeyDown = (args) => {
                if (originalOnKeyDown) {
                    originalOnKeyDown(args);
                }
                if (args.event.key === 'Enter' || args.event.key === 'Tab') {
                    setTimeout(() => {
                        if (saveAllButtonRef.current) {
                            const buttonElement = saveAllButtonRef.current.element();
                            if (buttonElement) {
                                buttonElement.focus();
                            }
                        }
                    }, 100);
                }
            };
        }
    };

    const calculateAmount = (data) => (parseFloat(data.Qty) || 0) * (parseFloat(data.Rate) || 0);

    const handleBulkSave = async () => {
        if (!gridData.length) {
            notify('No records to save.', 'warning', 2000);
            return;
        }

        try {
            const payload = gridData.map(d => ({
                IDNumber: d.SODetID || 0,
                SOID: soId,
                ItemID: d.ItemID,
                UnitID: d.UnitID,
                Qty: parseFloat(d.Qty) || 0,
                Rate: parseFloat(d.Rate) || 0,
                Amount: parseFloat(d.Amount) || calculateAmount(d)
            }));

            const apiUrl = `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?OP=SAL_SalesOrderDetail_Save&json=${encodeURIComponent(JSON.stringify(payload))}`;
            const res = await fetch(apiUrl);
            const result = await res.json();

            if (result && result[0]?.ErrCode === "1") {
                notify('All records saved successfully!', 'success', 2000);
                await fetchSalesOrderDetails();
                focusAddButton();
            } else {
                throw new Error(result?.[0]?.ErrMsg || 'Unknown error occurred');
            }
        } catch (err) {
            notify('Error during bulk save: ' + err.message, 'error', 3000);
        }
    };

    const handleCancel = () => {
        const gridInstance = gridRef.current?.instance;
        if (gridInstance) {
            gridInstance.cancelEditData();
        }
        focusAddButton();
    };

    const onRowInserted = (e) => {
        setGridData([...gridData, e.data]);
    };

    const onRowUpdated = (e) => {
        const newData = gridData.map(d => d.id === e.key ? { ...d, ...e.data } : d);
        setGridData(newData);
    };

    const onRowRemoved = (e) => {
        setGridData(gridData.filter(d => d.id !== e.key));
    };

    const handleSaveButtonKeyDown = (e) => {
        if (e.event.key === 'Enter' || e.event.key === 'Tab') {
            e.event.preventDefault();
            if (cancelButtonRef.current) {
                const buttonElement = cancelButtonRef.current.element();
                if (buttonElement) {
                    buttonElement.focus();
                }
            }
        }
    };

    const handleCancelButtonKeyDown = (e) => {
        if (e.event.key === 'Enter' || e.event.key === 'Tab') {
            e.event.preventDefault();
            focusAddButton();
        }
    };

    return (
        <>
            <style>{`
                .dx-datagrid-addrow-button:focus {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5), 0 6px 20px rgba(102, 126, 234, 0.4) !important;
                    transform: scale(1.02);
                }

                .save-all-button.focused,
                .cancel-button.focused {
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5), 0 6px 20px rgba(102, 126, 234, 0.4) !important;
                    transform: scale(1.02);
                }

                .button-group {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 20px;
                }
            `}</style>

            <div className="sales-order-grid-container">
                <div className="grid-header">
                    <div className="grid-title">Sales Order Details</div>
                </div>

                <DataGrid
                    ref={gridRef}
                    dataSource={gridData}
                    keyExpr="id"
                    showBorders={false}
                    showRowLines={true}
                    rowAlternationEnabled={true}
                    hoverStateEnabled={true}
                    columnAutoWidth={true}
                    onEditorPreparing={onEditorPreparing}
                    onRowInserted={onRowInserted}
                    onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}
                >
                    <Editing
                        mode="row"
                        allowAdding
                        allowUpdating
                        allowDeleting
                        useIcons
                        newRowPosition="last"
                    />

                    <Scrolling mode="standard" />

                    <Column dataField="MainGroupID" caption="Main Group" width={200}>
                        <Lookup
                            dataSource={mainGroups}
                            valueExpr="MainGroupID"
                            displayExpr="MainGroup"
                        />
                        <RequiredRule message="Main Group is required" />
                    </Column>

                    <Column dataField="SubMainGroupID" caption="Sub Main Group" width={200}>
                        <Lookup
                            dataSource={subMainGroups}
                            valueExpr="SubMainGroupID"
                            displayExpr="SubMianGroup"
                        />
                    </Column>

                    <Column dataField="ItemID" caption="Item" width={250}>
                        <Lookup
                            dataSource={items}
                            valueExpr="ItemID"
                            displayExpr="ItemName"
                        />
                    </Column>

                    <Column dataField="UnitID" caption="Unit" width={100}>
                        <Lookup
                            dataSource={units}
                            valueExpr="UnitID"
                            displayExpr="Unit"
                        />
                    </Column>

                    <Column dataField="Qty" caption="Quantity" dataType="number" format="#,##0.000" />
                    <Column dataField="Rate" caption="Rate" dataType="number" format="#,##0.00000000" />
                    <Column
                        dataField="Amount"
                        caption="Amount"
                        dataType="number"
                        format="#,##0.000"
                        allowEditing={false}
                        calculateCellValue={calculateAmount}
                    />

                    <Summary>
                        <TotalItem
                            column="Amount"
                            summaryType="sum"
                            valueFormat="#,##0.00"
                            displayFormat="Total: {0}"
                        />
                    </Summary>

                    <Column type="buttons" width={110}>
                        <GridButton name="edit" />
                        <GridButton name="delete" />
                    </Column>
                </DataGrid>

                <div className="button-group">
                    <Button
                        ref={saveAllButtonRef}
                        text="Save All"
                        type="success"
                        stylingMode="contained"
                        onClick={handleBulkSave}
                        onKeyDown={handleSaveButtonKeyDown}
                        className={`save-all-button ${saveButtonFocused ? 'focused' : ''}`}
                        onFocus={() => setSaveButtonFocused(true)}
                        onBlur={() => setSaveButtonFocused(false)}
                    />
                    {/* <Button
                        ref={cancelButtonRef}
                        text="Cancel"
                        type="normal"
                        stylingMode="contained"
                        onClick={handleCancel}
                        onKeyDown={handleCancelButtonKeyDown}
                        className={`cancel-button ${cancelButtonFocused ? 'focused' : ''}`}
                        onFocus={() => setCancelButtonFocused(true)}
                        onBlur={() => setCancelButtonFocused(false)}
                    /> */}
                </div>
            </div>
        </>
    );
};

export default SalesOrderEntryGrid;
