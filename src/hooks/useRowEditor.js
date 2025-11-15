// hooks/useRowEditor.js
import { useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { validateRow, checkDuplicateRow } from '../utils/validationUtils';
import { createSavePayload } from '../utils/dataMapper';

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
            const response = await fetch(API_ENDPOINTS.SAVE_DETAIL(JSON.stringify(payload)));
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
