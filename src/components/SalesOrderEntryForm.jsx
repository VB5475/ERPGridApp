import React, { useState, useEffect, useRef } from 'react';
import Form, {
    SimpleItem,
    GroupItem,
    Label,
    ButtonItem,
    RequiredRule
} from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import SalesOrderEntryGrid from './SalesOrderEntryGrid';

const SalesOrderForm = () => {
    const formRef = useRef(null);
    const saveButtonRef = useRef(null);

    const [formData, setFormData] = useState({
        soNumber: '',
        soDate: new Date(),
        division: null,
        soType: null,
        customer: null
    });

    const [divisions, setDivisions] = useState([]);
    const [soTypes, setSOTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [soId, setSoId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [buttonFocused, setButtonFocused] = useState(false);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetSalesDivision');
            const data = await response.json();
            setDivisions(data || []);
        } catch (error) {
            notify({
                message: 'Error fetching divisions: ' + error.message,
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSOTypes = async (divisionId) => {
        if (!divisionId) {
            setSOTypes([]);
            return;
        }

        try {
            const response = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetSOType&DivID=${divisionId}`);
            const data = await response.json();
            setSOTypes(data || []);
        } catch (error) {
            notify({
                message: 'Error fetching SO types: ' + error.message,
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
            setSOTypes([]);
        }
    };

    const fetchCustomers = async (divisionId) => {
        if (!divisionId) {
            setCustomers([]);
            return;
        }

        try {
            const response = await fetch(`http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetCustDivWs&DivID=${divisionId}`);
            const data = await response.json();
            setCustomers(data || []);
        } catch (error) {
            notify({
                message: 'Error fetching customers: ' + error.message,
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
            setCustomers([]);
        }
    };

    const handleDivisionChange = (e) => {
        const selectedDivisionId = e.value;
        setFormData(prev => ({
            ...prev,
            division: selectedDivisionId,
            soType: null,
            customer: null
        }));

        if (selectedDivisionId) {
            fetchSOTypes(selectedDivisionId);
            fetchCustomers(selectedDivisionId);
        } else {
            setSOTypes([]);
            setCustomers([]);
        }
    };

    const handleCustomerKeyDown = (e) => {
        if (e.event.key === 'Enter' || e.event.key === 'Tab') {
            setTimeout(() => {
                if (saveButtonRef.current) {
                    const buttonElement = saveButtonRef.current.element();
                    if (buttonElement) {
                        buttonElement.focus();
                    }
                }
            }, 100);
        }
    };

    const soNumberOptions = {
        value: formData.soNumber,
        readOnly: true
    };

    const soDateOptions = {
        displayFormat: 'dd/MM/yyyy',
        openOnFieldClick: true,
        type: 'date'
    };

    const divisionOptions = {
        items: divisions,
        displayExpr: 'DivisionName',
        valueExpr: 'DivisionID',
        searchEnabled: true,
        placeholder: 'Select Division',
        onValueChanged: handleDivisionChange,
        disabled: loading
    };

    const soTypeOptions = {
        items: soTypes,
        displayExpr: 'SOType',
        valueExpr: 'SOTypeID',
        searchEnabled: true,
        placeholder: 'Select SO Type',
        disabled: !formData.division || loading
    };

    const customerOptions = {
        items: customers,
        displayExpr: 'CustCodeName',
        valueExpr: 'CustomerId',
        searchEnabled: true,
        placeholder: 'Select Customer',
        disabled: !formData.division || loading,
        onKeyDown: handleCustomerKeyDown
    };

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSaveAndAddItem = async () => {
        if (!formData.soDate || !formData.division || !formData.soType || !formData.customer) {
            notify({
                message: 'Please fill in all required fields',
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
            return;
        }

        try {
            const formattedDate = formatDate(formData.soDate);

            const payload = [{
                IDNumber: 0,
                SONo: "",
                SODate: formattedDate,
                SOTypeID: formData.soType,
                CustomerID: formData.customer,
                YearID: 1,
                DivisionID: formData.division,
                LoginID: 1
            }];

            const apiUrl = `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?OP=SAL_SalesOrderMaster_Save&json=${encodeURIComponent(JSON.stringify(payload))}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.length > 0 && data[0].ErrCode === "1") {
                const savedSONo = data[0].SONO;
                const savedIDNumber = data[0].IDNumber;

                setFormData(prev => ({
                    ...prev,
                    soNumber: savedSONo
                }));
                setSoId(savedIDNumber);

                notify({
                    message: `Sales Order #${savedSONo} saved successfully! Ready to add items.`,
                    type: 'success',
                    displayTime: 3000,
                    position: { at: 'top center', my: 'top center' }
                });

                setTimeout(() => {
                    const addButton = document.querySelector('.dx-datagrid-addrow-button');
                    if (addButton) {
                        addButton.focus();
                    }
                }, 300);
            } else {
                const errorMsg = data && data.length > 0 ? data[0].ErrMsg : 'Unknown error occurred';
                notify({
                    message: `Error: ${errorMsg}`,
                    type: 'error',
                    displayTime: 3000,
                    position: { at: 'top center', my: 'top center' }
                });
            }
        } catch (error) {
            notify({
                message: 'Error saving sales order: ' + error.message,
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        }
    };

    const saveButtonOptions = {
        text: 'Save & Add Item',
        type: 'success',
        onClick: handleSaveAndAddItem,
        icon: 'save',
        elementAttr: {
            ref: saveButtonRef,
            onFocus: () => setButtonFocused(true),
            onBlur: () => setButtonFocused(false)
        }
    };

    return (
        <>
            <style>{`
                body, html, #root {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    min-height: 100vh;
                }

                .dx-field-item-label-text {
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }

                .dx-texteditor.dx-editor-outlined {
                    border-radius: 8px;
                    border: 2px solid #e5e7eb;
                    transition: all 0.3s ease;
                }

                .dx-texteditor.dx-state-focused {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .dx-texteditor.dx-state-hover:not(.dx-state-focused) {
                    border-color: #9ca3af;
                }

                .button-group {
                    margin-top: 35px;
                    padding-top: 25px;
                    border-top: 2px solid #e5e7eb;
                }

                .dx-button.dx-button-success {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    border: none !important;
                    font-weight: 600 !important;
                    padding: 12px 24px !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
                    transition: all 0.3s ease !important;
                    font-size: 15px !important;
                    width: auto !important;
                }

                .dx-button.dx-button-success:hover {
                    background: linear-gradient(135deg, #5568d3 0%, #653a8a 100%) !important;
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
                    transform: translateY(-2px) !important;
                }

                .dx-button.dx-button-success:active {
                    transform: translateY(0) !important;
                }

                .dx-button.dx-button-success:focus-visible,
                .dx-button.dx-button-success:focus {
                    outline: none !important;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5), 0 6px 20px rgba(102, 126, 234, 0.4) !important;
                    transform: scale(1.02) !important;
                }

                .dx-selectbox-popup-wrapper .dx-list-item {
                    padding: 10px 14px;
                    transition: background-color 0.2s ease;
                }

                .dx-selectbox-popup-wrapper .dx-list-item:hover {
                    background-color: #f3f4f6;
                }

                .dx-selectbox-popup-wrapper .dx-list-item.dx-state-focused {
                    background-color: #e0e7ff;
                }

                .dx-invalid.dx-texteditor {
                    border-color: #ef4444;
                }

                .dx-field-item-label {
                    padding-top: 10px;
                }

                .dx-texteditor-input {
                    padding: 10px 12px;
                    font-size: 14px;
                }

                .dx-placeholder::before {
                    color: #9ca3af;
                    font-style: italic;
                }

                @media (max-width: 768px) {
                    .dx-form-group {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '40px 20px',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '45px',
                    maxWidth: '1350px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    boxSizing: 'border-box',
                    margin: '0 auto'
                }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '35px'
                    }}>
                        <h1 style={{
                            margin: '0 0 10px 0',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '32px',
                            fontWeight: '700',
                            letterSpacing: '-0.5px'
                        }}>
                            Sales Order Entry
                        </h1>
                        <p style={{
                            margin: 0,
                            color: '#6b7280',
                            fontSize: '15px'
                        }}>
                            Create a new sales order
                        </p>
                    </div>

                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '12px',
                            marginBottom: '25px',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            borderRadius: '8px',
                            color: '#667eea',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            Loading data...
                        </div>
                    ) : <>
                        <Form
                            ref={formRef}
                            formData={formData}
                            onFieldDataChanged={(e) => {
                                if (e.dataField !== 'division') {
                                    setFormData(prevData => ({
                                        ...prevData,
                                        [e.dataField]: e.value
                                    }));
                                }
                            }}
                            labelLocation="left"
                            showColonAfterLabel={true}
                            colCount={3}
                        >
                            <SimpleItem
                                dataField="soNumber"
                                editorType="dxTextBox"
                                editorOptions={soNumberOptions}
                            >
                                <Label text="SO No." />
                            </SimpleItem>

                            <SimpleItem
                                dataField="soDate"
                                editorType="dxDateBox"
                                editorOptions={soDateOptions}
                                colSpan={2}
                            >
                                <Label text="SO Date" />
                                <RequiredRule message="SO Date is required" />
                            </SimpleItem>

                            <SimpleItem
                                dataField="division"
                                editorType="dxSelectBox"
                                editorOptions={divisionOptions}
                            >
                                <Label text="Division" />
                                <RequiredRule message="Division is required" />
                            </SimpleItem>

                            <SimpleItem
                                dataField="soType"
                                editorType="dxSelectBox"
                                editorOptions={soTypeOptions}
                            >
                                <Label text="SO Type" />
                                <RequiredRule message="SO Type is required" />
                            </SimpleItem>

                            <SimpleItem
                                dataField="customer"
                                editorType="dxSelectBox"
                                editorOptions={customerOptions}
                            >
                                <Label text="Customer" />
                                <RequiredRule message="Customer is required" />
                            </SimpleItem>

                            <GroupItem colSpan={3} cssClass="button-group">
                                <ButtonItem
                                    buttonOptions={saveButtonOptions}
                                    horizontalAlignment="center"
                                />
                            </GroupItem>
                        </Form>
                        {soId && <SalesOrderEntryGrid soId={soId} />}
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            color: '#4b5563',
                            borderLeft: '4px solid #667eea'
                        }}>
                            <div style={{
                                fontWeight: '700',
                                color: '#1f2937',
                                marginBottom: '12px',
                                fontSize: '14px'
                            }}>
                                Instructions
                            </div>
                            <ul style={{
                                margin: '0',
                                paddingLeft: '20px',
                                lineHeight: '1.8'
                            }}>
                                <li>Select a <strong>Division</strong> first to load SO Types and Customers</li>
                                <li>SO Number is <strong>auto-generated</strong></li>
                                <li>All fields are required except SO Number</li>
                                <li>Click <strong>"Save & Add Item"</strong> to proceed with adding order items</li>
                            </ul>
                        </div>
                    </>}
                </div>
            </div>
        </>
    );
};

export default SalesOrderForm;
