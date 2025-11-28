import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
import { Chip, Typography, TableRow, TableCell } from '@mui/material';
import MasterGrid, {
    MasterGridDisplayRow,
    MasterGridEditableRow,
    MasterGridEditableNumberField
} from './common/MasterGrid';
import { SharedAutocomplete } from './common/SharedAutocomplete';
import { SALESORDER_GRID_API_ENDPOINTS } from '../constants/api';
import { validateRow, checkDuplicateRow, calculateAmount, calculateTotal } from '../utils/validationUtils';
import { createSavePayload, mapOrderDetail } from '../utils/dataMapper';

const GRID_AUTOCOMPLETE_TEXTFIELD_SX = {
    bgcolor: 'white',
    borderRadius: 1,
    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
};

const GRID_AUTOCOMPLETE_SLOT_PROPS = {
    popper: {
        sx: { width: 'auto!important', minWidth: '200px' }
    }
};

const GRID_AUTOCOMPLETE_BASE_PROPS = {
    size: 'small',
    textFieldSx: GRID_AUTOCOMPLETE_TEXTFIELD_SX,
    slotProps: GRID_AUTOCOMPLETE_SLOT_PROPS
};

const SalesOrderGridMUI = forwardRef(({ soId, readOnly = false }, ref) => {
    const gridUiRef = useRef(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [deleting, setDeleting] = useState(false);

    const { orderDetails, loading: initialLoading, refetch } = useOrderDetails(soId);
    const dropdownData = useDropdownData();
    const mainGroupInputRef = useRef(null);

    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const rowEditor = useRowEditor(soId, orderDetails, refetch, showSnackbar);

    useImperativeHandle(ref, () => ({
        focusAddButton: () => gridUiRef.current?.focusAddButton?.()
    }), []);

    useEffect(() => {
        dropdownData.fetchMainGroups();
    }, []);

    const handleEdit = useCallback(async (row) => {
        rowEditor.startEdit(row);
        if (row.MainGroupID) {
            await dropdownData.fetchSubMainGroups(row.MainGroupID);
            if (row.SubMainGroupID) {
                await dropdownData.fetchItems(row.MainGroupID, row.SubMainGroupID);
            }
        }
        if (row.ItemID) {
            await dropdownData.fetchUnits(row.ItemID);
        }
    }, [dropdownData, rowEditor]);

    const handleSaveEdit = useCallback(async () => {
        const success = await rowEditor.saveRow(rowEditor.editingRow, false);
        if (success) {
            gridUiRef.current?.focusAddButton?.();
        }
    }, [rowEditor]);

    const handleSaveNew = useCallback(async () => {
        const success = await rowEditor.saveRow(rowEditor.newRow, true);
        if (success) {
            gridUiRef.current?.focusAddButton?.();
        }
    }, [rowEditor]);

    const handleDelete = useCallback(async (row) => {
        if (!row) return;
        try {
            setDeleting(true);
            await fetch(SALESORDER_GRID_API_ENDPOINTS.DELETE_DETAIL(row.IDNumber));
            showSnackbar('Item deleted successfully!', 'success');
            await refetch();
            setDeleteDialog({ open: false, row: null });
        } catch (error) {
            showSnackbar('Error deleting item: ' + error.message, 'error');
        } finally {
            setDeleting(false);
        }
    }, [refetch, showSnackbar]);

    const createRowHandlers = useCallback((isNew) => {
        const row = isNew ? rowEditor.newRow : rowEditor.editingRow;
        const setRow = isNew ? rowEditor.setNewRow : rowEditor.setEditingRow;

        return {
            onMainGroupChange: (_e, newValue) => {
                setRow((prev) => prev ? ({
                    ...prev,
                    MainGroupID: newValue?.MainGroupID || null,
                    SubMainGroupID: null,
                    ItemID: null,
                    UnitID: null
                }) : null);
                if (newValue) dropdownData.fetchSubMainGroups(newValue.MainGroupID);
            },
            onSubMainGroupChange: (_e, newValue) => {
                setRow((prev) => prev ? ({
                    ...prev,
                    SubMainGroupID: newValue?.SubMainGroupID || null,
                    ItemID: null,
                    UnitID: null
                }) : null);
                if (newValue && row?.MainGroupID) {
                    dropdownData.fetchItems(row.MainGroupID, newValue.SubMainGroupID);
                }
            },
            onItemChange: (_e, newValue) => {
                setRow((prev) => prev ? ({
                    ...prev,
                    ItemID: newValue?.ItemID || null,
                    UnitID: null
                }) : null);
                if (newValue) dropdownData.fetchUnits(newValue.ItemID);
            },
            onUnitChange: (_e, newValue) => {
                setRow((prev) => prev ? ({ ...prev, UnitID: newValue?.UnitID || null }) : null);
            }
        };
    }, [dropdownData, rowEditor.editingRow, rowEditor.newRow]);

    const rowHandlers = useMemo(() => ({
        newRow: createRowHandlers(true),
        editRow: createRowHandlers(false)
    }), [createRowHandlers]);

    const totalAmount = useMemo(() => calculateTotal(orderDetails), [orderDetails]);

    const displayColumns = useMemo(() => [
        { key: 'MainGroup' },
        { key: 'SubMainGroup' },
        { key: 'ItemName' },
        { key: 'Unit' },
        {
            key: 'Qty',
            align: 'center',
            render: (row) => (
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {row.Qty}
                </Typography>
            )
        },
        {
            key: 'Rate',
            align: 'center',
            render: (row) => (
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {row.Rate.toFixed(2)}
                </Typography>
            )
        },
        {
            key: 'Amount',
            align: 'right',
            render: (row) => (
                <Chip
                    label={`₹ ${row.Amount.toFixed(2)}`}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                />
            )
        }
    ], []);

    const buildEditableColumns = useCallback((handlerSet) => [
        {
            key: 'MainGroup',
            autoFocus: true,
            inputRef: mainGroupInputRef,
            render: ({ row, autoFocus, inputRef }) => (
                <SharedAutocomplete
                    {...GRID_AUTOCOMPLETE_BASE_PROPS}
                    width={160}
                    options={dropdownData.mainGroups}
                    value={dropdownData.mainGroups.find(g => g.MainGroupID === row.MainGroupID) || null}
                    onChange={handlerSet.onMainGroupChange}
                    getOptionLabel={(option) => option?.MainGroup || ''}
                    disabled={readOnly}
                    placeholder="Select main group"
                    autoFocus={autoFocus}
                    inputRef={inputRef}
                />
            )
        },
        {
            key: 'SubMainGroup',
            render: ({ row }) => (
                <SharedAutocomplete
                    {...GRID_AUTOCOMPLETE_BASE_PROPS}
                    width={160}
                    options={dropdownData.subMainGroups}
                    value={dropdownData.subMainGroups.find(g => g.SubMainGroupID === row.SubMainGroupID) || null}
                    onChange={handlerSet.onSubMainGroupChange}
                    getOptionLabel={(option) => option?.SubMianGroup || ''}
                    disabled={!row.MainGroupID || readOnly}
                    placeholder="Select sub main group"
                />
            )
        },
        {
            key: 'Item',
            render: ({ row }) => (
                <SharedAutocomplete
                    {...GRID_AUTOCOMPLETE_BASE_PROPS}
                    width={140}
                    options={dropdownData.items}
                    value={dropdownData.items.find(i => i.ItemID === row.ItemID) || null}
                    onChange={handlerSet.onItemChange}
                    getOptionLabel={(option) => option?.ItemName || ''}
                    disabled={!row.SubMainGroupID || readOnly}
                    placeholder="Select item"
                />
            )
        },
        {
            key: 'Unit',
            render: ({ row }) => (
                <SharedAutocomplete
                    {...GRID_AUTOCOMPLETE_BASE_PROPS}
                    width={100}
                    options={dropdownData.units}
                    value={dropdownData.units.find(u => u.UnitID === row.UnitID) || null}
                    onChange={handlerSet.onUnitChange}
                    getOptionLabel={(option) => option?.Unit || ''}
                    disabled={!row.ItemID || readOnly}
                    placeholder="Select unit"
                />
            )
        },
        {
            key: 'Qty',
            align: 'center',
            render: ({ row, setRow }) => (
                <MasterGridEditableNumberField
                    value={row.Qty}
                    onChange={(value) => setRow(prev => prev ? ({
                        ...prev,
                        Qty: value,
                        Amount: calculateAmount(value, prev.Rate)
                    }) : null)}
                    width={80}
                    step={0.001}
                />
            )
        },
        {
            key: 'Rate',
            align: 'center',
            render: ({ row, setRow }) => (
                <MasterGridEditableNumberField
                    value={row.Rate}
                    onChange={(value) => setRow(prev => prev ? ({
                        ...prev,
                        Rate: value,
                        Amount: calculateAmount(prev.Qty, value)
                    }) : null)}
                    width={90}
                    step={0.01}
                />
            )
        },
        {
            key: 'Amount',
            align: 'right',
            render: ({ row }) => (
                <Chip
                    label={row.Amount?.toFixed ? row.Amount.toFixed(2) : Number(row.Amount || 0).toFixed(2)}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26, width: 80 }}
                />
            )
        }
    ], [dropdownData, readOnly]);

    const tableHeaders = useMemo(() => {
        const headers = [
            { key: 'mainGroup', label: 'Main Group' },
            { key: 'subMainGroup', label: 'Sub Main Group' },
            { key: 'item', label: 'Item' },
            { key: 'unit', label: 'Unit' },
            { key: 'qty', label: 'Qty', align: 'center' },
            { key: 'rate', label: 'Rate', align: 'center' },
            { key: 'amount', label: 'Amount', align: 'right' }
        ];
        if (!readOnly) headers.push({ key: 'actions', label: 'Actions', align: 'center' });
        return headers;
    }, [readOnly]);

    const renderDisplayRow = useCallback(({ key, row, disabled, onEdit, onDelete }) => (
        <MasterGridDisplayRow
            key={key}
            columns={displayColumns}
            row={row}
            readOnly={readOnly}
            disabled={disabled}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    ), [displayColumns, readOnly]);

    const renderNewRow = useCallback(({ row, setRow, save, cancel, saving }) => (
        <MasterGridEditableRow
            key="new-row"
            columns={buildEditableColumns(rowHandlers.newRow)}
            row={row}
            setRow={setRow}
            readOnly={readOnly}
            onSave={save}
            onCancel={cancel}
            saving={saving}
        />
    ), [buildEditableColumns, readOnly, rowHandlers]);

    const renderEditRow = useCallback(({ key, row, setRow, save, cancel, saving }) => (
        <MasterGridEditableRow
            key={`edit-${key}`}
            columns={buildEditableColumns(rowHandlers.editRow)}
            row={row}
            setRow={setRow}
            readOnly={readOnly}
            onSave={save}
            onCancel={cancel}
            saving={saving}
        />
    ), [buildEditableColumns, readOnly, rowHandlers]);

    const renderSummaryRow = useCallback(({ readOnly: ro }) => (
        <TableRow sx={{ bgcolor: '#f1f5f9', '& .MuiTableCell-root': { borderTop: '2px solid #cbd5e1' } }}>
            <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', py: 1.5 }}>
                Total:
            </TableCell>
            <TableCell align="right" sx={{ py: 1.5 }}>
                <Chip
                    label={`₹ ${totalAmount.toFixed(2)}`}
                    color="primary"
                    sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        height: 32,
                        minWidth: 120,
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    }}
                />
            </TableCell>
            {!ro && <TableCell />}
        </TableRow>
    ), [totalAmount]);

    const deleteDialogConfig = {
        open: deleteDialog.open,
        row: deleteDialog.row,
        title: 'Confirm Delete',
        description: deleteDialog.row ? `Are you sure you want to delete ${deleteDialog.row.ItemName}?` : undefined,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel'
    };

    return (
        <MasterGrid
            ref={gridUiRef}
            title="Order Details"
            subtitle={soId ? `SO ID: ${soId}` : undefined}
            addButtonLabel="Add Item"
            readOnly={readOnly}
            initialLoading={initialLoading}
            isBusy={rowEditor.savingRowId !== null}
            rows={orderDetails}
            rowKeyAccessor={(row) => row.IDNumber}
            newRow={rowEditor.newRow}
            editingRow={rowEditor.editingRow}
            editingRowId={rowEditor.editingRowId}
            savingRowId={rowEditor.savingRowId}
            tableHeaders={tableHeaders}
            renderNewRow={renderNewRow}
            renderEditRow={renderEditRow}
            renderDisplayRow={renderDisplayRow}
            renderSummaryRow={renderSummaryRow}
            onStartNew={rowEditor.startNew}
            onCancelNew={rowEditor.cancelNew}
            onSaveNew={handleSaveNew}
            onStartEdit={handleEdit}
            onCancelEdit={rowEditor.cancelEdit}
            onSaveEdit={handleSaveEdit}
            onDeleteRequest={(row) => setDeleteDialog({ open: true, row })}
            onUpdateNewRow={rowEditor.setNewRow}
            onUpdateEditingRow={rowEditor.setEditingRow}
            snackbar={snackbar}
            onCloseSnackbar={() => setSnackbar(prev => ({ ...prev, open: false }))}
            deleteDialog={deleteDialogConfig}
            onCloseDeleteDialog={() => setDeleteDialog({ open: false, row: null })}
            onConfirmDelete={handleDelete}
            deleting={deleting}
        />
    );
});

SalesOrderGridMUI.displayName = 'SalesOrderGridMUI';

export default SalesOrderGridMUI;

const useDropdownData = () => {
    const [mainGroups, setMainGroups] = useState([]);
    const [subMainGroups, setSubMainGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);

    const fetchData = async (url, setter, errorMsg) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            setter(data || []);
        } catch (error) {
            throw new Error(errorMsg + error.message);
        }
    };

    const fetchMainGroups = () =>
        fetchData(SALESORDER_GRID_API_ENDPOINTS.MAIN_GROUPS, setMainGroups, 'Error fetching main groups: ');

    const fetchSubMainGroups = (mainGroupId) => {
        if (!mainGroupId) {
            setSubMainGroups([]);
            return;
        }
        return fetchData(SALESORDER_GRID_API_ENDPOINTS.SUB_MAIN_GROUPS(mainGroupId), setSubMainGroups, 'Error fetching sub main groups: ');
    };

    const fetchItems = (mainGroupId, subMainGroupId) => {
        if (!mainGroupId || !subMainGroupId) {
            setItems([]);
            return;
        }
        return fetchData(SALESORDER_GRID_API_ENDPOINTS.ITEMS(mainGroupId, subMainGroupId), setItems, 'Error fetching items: ');
    };

    const fetchUnits = (itemId) => {
        if (!itemId) {
            setUnits([]);
            return;
        }
        return fetchData(SALESORDER_GRID_API_ENDPOINTS.UNITS(itemId), setUnits, 'Error fetching units: ');
    };

    return {
        mainGroups,
        subMainGroups,
        items,
        units,
        fetchMainGroups,
        fetchSubMainGroups,
        fetchItems,
        fetchUnits
    };
};

const useOrderDetails = (soId) => {
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(SALESORDER_GRID_API_ENDPOINTS.ORDER_DETAILS(soId));
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                setOrderDetails(data.map(mapOrderDetail));
            } else {
                setOrderDetails([]);
            }
        } catch (err) {
            setOrderDetails([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (soId) fetchOrderDetails();
    }, [soId]);

    return { orderDetails, loading, refetch: fetchOrderDetails };
};

const useRowEditor = (soId, orderDetails, onSuccess, showSnackbar) => {
    const [editingRowId, setEditingRowId] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [newRow, setNewRow] = useState(null);
    const [savingRowId, setSavingRowId] = useState(null);

    const saveRow = async (row, isNew = false) => {
        const errors = validateRow(row);
        if (errors.length > 0) {
            showSnackbar(errors[0], 'error');
            return false;
        }

        if (checkDuplicateRow(orderDetails, row.MainGroupID, row.SubMainGroupID, row.ItemID, isNew ? null : editingRowId)) {
            showSnackbar('Duplicate row detected. A row with the same Main Group, Sub Main Group, and Item already exists.', 'error');
            return false;
        }

        try {
            setSavingRowId(isNew ? 'new' : editingRowId);
            const payload = createSavePayload(row, soId);
            const response = await fetch(SALESORDER_GRID_API_ENDPOINTS.SAVE_DETAIL(JSON.stringify(payload)));
            const result = await response.json();

            if (result?.[0]?.ErrCode === '1') {
                showSnackbar(isNew ? 'Item added successfully!' : 'Record saved successfully!', 'success');
                await onSuccess();
                if (isNew) {
                    setNewRow(null);
                } else {
                    setEditingRowId(null);
                    setEditingRow(null);
                }
                return true;
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error saving record', 'error');
                return false;
            }
        } catch (error) {
            showSnackbar('Error saving record: ' + error.message, 'error');
            return false;
        } finally {
            setSavingRowId(null);
        }
    };

    const startEdit = (row) => {
        setEditingRowId(row.IDNumber);
        setEditingRow({ ...row });
    };

    const cancelEdit = () => {
        setEditingRowId(null);
        setEditingRow(null);
    };

    const startNew = () => {
        setNewRow({
            MainGroupID: null,
            SubMainGroupID: null,
            ItemID: null,
            UnitID: null,
            Qty: 0,
            Rate: 0,
            Amount: 0,
        });
    };

    const cancelNew = () => {
        setNewRow(null);
    };

    return {
        editingRowId,
        editingRow,
        setEditingRow,
        newRow,
        setNewRow,
        savingRowId,
        saveRow,
        startEdit,
        cancelEdit,
        startNew,
        cancelNew
    };
};

