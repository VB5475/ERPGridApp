// SalesOrderGridMUI.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Chip, Snackbar,
    Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useOrderDetails } from '../../hooks/useOrderDetails';
import { useDropdownData } from '../../hooks/useDropdownData';
import { useRowEditor } from '../../hooks/useRowEditor';
import { OrderDetailRow } from './common/OrderDetailRow';
import { EditableRow } from './common/EditableRow';
import { calculateTotal } from '../../utils/validationUtils';
import { API_ENDPOINTS } from '../../constants/api';

const SalesOrderGridMUI = forwardRef(({ soId, readOnly = false }, ref) => {
    const [deleteDialog, setDeleteDialog] = React.useState({ open: false, row: null });
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = React.useState(false);

    const addButtonRef = useRef(null);
    const mainGroupInputRef = useRef(null);

    const { orderDetails, loading: initialLoading, refetch } = useOrderDetails(soId);
    const dropdownData = useDropdownData();

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const rowEditor = useRowEditor(soId, orderDetails, refetch, showSnackbar);

    useImperativeHandle(ref, () => ({
        focusAddButton: () => {
            setTimeout(() => {
                addButtonRef.current?.focus();
                addButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }));

    useEffect(() => {
        dropdownData.fetchMainGroups();
    }, []);

    useEffect(() => {
        if (rowEditor.editingRowId !== null && mainGroupInputRef.current) {
            setTimeout(() => mainGroupInputRef.current?.focus(), 100);
        }
    }, [rowEditor.editingRowId]);

    const handleEdit = async (row) => {
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
    };

    const handleSaveEdit = async () => {
        const success = await rowEditor.saveRow(rowEditor.editingRow, false);
        if (success) {
            setTimeout(() => addButtonRef.current?.focus(), 100);
        }
    };

    const handleSaveNew = async () => {
        const success = await rowEditor.saveRow(rowEditor.newRow, true);
        if (success) {
            setTimeout(() => addButtonRef.current?.focus(), 100);
        }
    };

    const handleDelete = async (row) => {
        try {
            setLoading(true);
            await fetch(API_ENDPOINTS.DELETE_DETAIL(row.IDNumber));
            showSnackbar('Item deleted successfully!', 'success');
            await refetch();
            setDeleteDialog({ open: false, row: null });
        } catch (error) {
            showSnackbar('Error deleting item: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const createRowHandlers = (isNew) => {
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
                if (newValue && row.MainGroupID) {
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
    };

    if (initialLoading) {
        return (
            <Paper elevation={2} sx={{ p: 3, mt: 2.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
                        Loading order details...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const isDisabled = rowEditor.newRow !== null || rowEditor.editingRowId !== null || loading || rowEditor.savingRowId !== null;

    return (
        <Paper elevation={2} sx={{ p: 2.5, mt: 2.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                    variant="h6"
                    sx={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                    }}
                >
                    Order Details (SO ID: {soId})
                </Typography>
                {!readOnly && (
                    <Button
                        ref={addButtonRef}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={rowEditor.startNew}
                        disabled={isDisabled}
                        size="small"
                        sx={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 0.75,
                            fontSize: '0.875rem',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            },
                            '&:focus': {
                                outline: '3px solid rgba(59, 130, 246, 0.5)',
                                outlineOffset: '2px',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Add Item
                    </Button>
                )}
            </Box>

            <TableContainer sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            {['Main Group', 'Sub Main Group', 'Item', 'Unit', 'Qty', 'Rate', 'Amount', !readOnly && 'Actions'].filter(Boolean).map((header, idx) => (
                                <TableCell
                                    key={idx}
                                    align={['Qty', 'Rate'].includes(header) ? 'center' : header === 'Amount' ? 'right' : header === 'Actions' ? 'center' : 'left'}
                                    sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rowEditor.newRow && (
                            <EditableRow
                                row={rowEditor.newRow}
                                setRow={rowEditor.setNewRow}
                                {...dropdownData}
                                {...createRowHandlers(true)}
                                onSave={handleSaveNew}
                                onCancel={rowEditor.cancelNew}
                                saving={rowEditor.savingRowId === 'new'}
                                readOnly={readOnly}
                                autoFocus={true}
                            />
                        )}
                        {orderDetails.length === 0 && !rowEditor.newRow && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary" variant="body2">
                                        No items added yet. Click "Add Item" to begin.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {orderDetails.map((row) => (
                            rowEditor.editingRowId === row.IDNumber ? (
                                <EditableRow
                                    key={row.IDNumber}
                                    row={rowEditor.editingRow}
                                    setRow={rowEditor.setEditingRow}
                                    {...dropdownData}
                                    {...createRowHandlers(false)}
                                    onSave={handleSaveEdit}
                                    onCancel={rowEditor.cancelEdit}
                                    saving={rowEditor.savingRowId === rowEditor.editingRowId}
                                    readOnly={readOnly}
                                    inputRef={mainGroupInputRef}
                                />
                            ) : (
                                <OrderDetailRow
                                    key={row.IDNumber}
                                    row={row}
                                    readOnly={readOnly}
                                    onEdit={handleEdit}
                                    onDelete={(r) => setDeleteDialog({ open: true, row: r })}
                                    disabled={isDisabled}
                                />
                            )
                        ))}
                        {orderDetails.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f1f5f9', '& .MuiTableCell-root': { borderTop: '2px solid #cbd5e1' } }}>
                                <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', py: 1.5 }}>
                                    Total:
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Chip
                                        label={`₹ ${calculateTotal(orderDetails).toFixed(2)}`}
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
                                {!readOnly && <TableCell />}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, row: null })}
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.875rem' }}>
                        Are you sure you want to delete this record? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, row: null })}
                        disabled={loading}
                        sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDelete(deleteDialog.row)}
                        color="error"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{ borderRadius: 2, fontSize: '0.875rem' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
});

SalesOrderGridMUI.displayName = 'SalesOrderGridMUI';

export default SalesOrderGridMUI;