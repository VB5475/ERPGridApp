import React, { useState } from 'react';
import {
    Box, Paper, Typography, IconButton, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { MaterialReactTable } from 'material-react-table';
import SalesOrderGridMUI from './SalesOrderGridMUI';
import { useSalesOrders, useTableColumns } from '../../hooks/SalesOrderlist_hooks.jsx';

const TABLE_CONFIG = {
    enableRowActions: true,
    enableColumnFilterModes: false,
    enableColumnOrdering: false,
    enableColumnDragging: false,
    enableGrouping: true,
    enablePinning: true,
    enableColumnResizing: false,
    enableExpanding: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableColumnActions: false,
    positionActionsColumn: "last",
    enableFilterMatchHighlighting: true
};

const SalesOrderList = () => {
    const history = useHistory();
    const { masterData, loading, snackbar, setSnackbar, fetchMasterData, deleteSalesOrder } = useSalesOrders();
    const columns = useTableColumns(masterData);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null });

    const handleEdit = (row) => history.push(`/sales-order/edit/${row.IDNumber}`);
    const handleAddNew = () => history.push('/sales-order/new');

    const handleDelete = async () => {
        if (!deleteDialog.record) return;
        const success = await deleteSalesOrder(deleteDialog.record.IDNumber);
        if (success) setDeleteDialog({ open: false, record: null });
    };

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2, bgcolor: '#f5f5f5' }}>
            <Paper elevation={3} sx={{ maxWidth: '1600px', width: '100%', margin: '0 auto', p: 3, borderRadius: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
                        Sales Order Master
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Manage your sales orders with expandable details
                    </Typography>
                </Box>

                <MaterialReactTable
                    columns={columns}
                    data={masterData}
                    state={{ isLoading: loading }}
                    {...TABLE_CONFIG}
                    muiFilterTextFieldProps={{
                        sx: { minWidth: '150px', padding: 0 },
                        variant: 'outlined',
                        size: 'small',
                        InputProps: { sx: { padding: 0 } }
                    }}
                    muiFilterAutocompleteProps={{
                        sx: {
                            minWidth: '150px',
                            '& .MuiInputBase-root': { padding: '0 !important' },
                            '& .MuiAutocomplete-inputRoot': { padding: '4px !important' }
                        },
                        size: 'small'
                    }}
                    renderRowActions={({ row }) => (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                                <IconButton size="small" color="primary" onClick={() => handleEdit(row.original)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteDialog({ open: true, record: row.original })}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                    renderDetailPanel={({ row }) => (
                        <Box sx={{ py: 2, px: 2, bgcolor: '#fafafa' }}>
                            <SalesOrderGridMUI soId={row.original.IDNumber} readOnly={true} />
                        </Box>
                    )}
                    renderTopToolbarCustomActions={() => (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchMasterData}>
                                Refresh
                            </Button>
                            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddNew}>
                                Add New
                            </Button>
                        </Box>
                    )}
                    muiTablePaperProps={{ elevation: 0, sx: { border: '1px solid #e0e0e0' } }}
                    initialState={{
                        pagination: { pageSize: 10, pageIndex: 0 },
                        density: 'comfortable',
                        showColumnFilters: true
                    }}
                />
            </Paper>

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, record: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete Sales Order <strong>{deleteDialog.record?.SONo}</strong>?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, record: null })}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SalesOrderList;