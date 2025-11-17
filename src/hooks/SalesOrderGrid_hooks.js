import { useState, useEffect } from 'react';
import { SALESORDER_GRID_API_ENDPOINTS } from '../constants/api';
import { validateRow, checkDuplicateRow } from '../utils/validationUtils';
import { createSavePayload } from '../utils/dataMapper';
import { mapOrderDetail } from '../utils/dataMapper';

export const useDropdownData = () => {
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
        if (!mainGroupId) return;
        return fetchData(SALESORDER_GRID_API_ENDPOINTS.SUB_MAIN_GROUPS(mainGroupId), setSubMainGroups, 'Error fetching sub main groups: ');
    };

    const fetchItems = (mainGroupId, subMainGroupId) => {
        if (!mainGroupId || !subMainGroupId) return;
        return fetchData(SALESORDER_GRID_API_ENDPOINTS.ITEMS(mainGroupId, subMainGroupId), setItems, 'Error fetching items: ');
    };

    const fetchUnits = (itemId) => {
        if (!itemId) return;
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

export const useOrderDetails = (soId) => {
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            setError(null);
        } catch (err) {
            setError('Error fetching order details: ' + err.message);
            setOrderDetails([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (soId) fetchOrderDetails();
    }, [soId]);

    return { orderDetails, loading, error, refetch: fetchOrderDetails };
};

export const useRowEditor = (soId, orderDetails, onSuccess, showSnackbar) => {
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

            if (result?.[0]?.ErrCode === "1") {
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
