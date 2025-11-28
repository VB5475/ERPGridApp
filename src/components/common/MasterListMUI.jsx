import React from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';

const DEFAULT_TABLE_CONFIG = {
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
    positionActionsColumn: 'last',
    enableFilterMatchHighlighting: true
};

const DEFAULT_INITIAL_STATE = {
    pagination: { pageSize: 10, pageIndex: 0 },
    density: 'comfortable',
    showColumnFilters: true
};

const MasterListMUI = ({
    title,
    subtitle,
    columns,
    data,
    loading = false,
    tableConfig = {},
    initialState = DEFAULT_INITIAL_STATE,
    toolbarActions = [],
    rowActions = [],
    renderDetailPanel,
    muiFilterTextFieldProps,
    muiFilterAutocompleteProps,
    snackbar,
    onCloseSnackbar,
    paperProps = {}
}) => {
    const [confirmState, setConfirmState] = React.useState({ open: false, action: null, record: null });

    const mergedTableConfig = React.useMemo(
        () => ({
            ...DEFAULT_TABLE_CONFIG,
            ...tableConfig
        }),
        [tableConfig]
    );

    const defaultFilterTextFieldProps = {
        sx: { minWidth: '150px', padding: 0 },
        variant: 'outlined',
        size: 'small',
        InputProps: { sx: { padding: 0 } }
    };

    const defaultFilterAutocompleteProps = {
        sx: {
            minWidth: '150px',
            '& .MuiInputBase-root': { padding: '0 !important' },
            '& .MuiAutocomplete-inputRoot': { padding: '4px !important' }
        },
        size: 'small'
    };

    const handleActionClick = (action, record) => {
        if (action.requiresConfirm) {
            setConfirmState({
                open: true,
                action,
                record
            });
        } else {
            action.onClick?.(record);
        }
    };

    const handleConfirm = async () => {
        if (!confirmState.action || !confirmState.record) return;
        const result = await confirmState.action.onClick?.(confirmState.record);
        if (result !== false) {
            setConfirmState({ open: false, action: null, record: null });
        }
    };

    const handleCloseDialog = () => setConfirmState({ open: false, action: null, record: null });

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2, bgcolor: '#f5f5f5' }}>
            <Paper
                elevation={3}
                sx={{ maxWidth: '1600px', width: '100%', margin: '0 auto', p: 3, borderRadius: 2 }}
                {...paperProps}
            >
                {(title || subtitle) && (
                    <Box sx={{ mb: 3 }}>
                        {title && (
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
                                {title}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                )}

                <MaterialReactTable
                    columns={columns}
                    data={data}
                    state={{ isLoading: loading }}
                    {...mergedTableConfig}
                    muiFilterTextFieldProps={{ ...defaultFilterTextFieldProps, ...muiFilterTextFieldProps }}
                    muiFilterAutocompleteProps={{ ...defaultFilterAutocompleteProps, ...muiFilterAutocompleteProps }}
                    renderRowActions={
                        rowActions.length
                            ? ({ row }) => (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {rowActions.map((action) => (
                                        <Tooltip title={action.tooltip} key={action.key}>
                                            <IconButton
                                                size="small"
                                                color={action.color || 'primary'}
                                                onClick={() => handleActionClick(action, row.original)}
                                            >
                                                {action.icon}
                                            </IconButton>
                                        </Tooltip>
                                    ))}
                                </Box>
                            )
                            : undefined
                    }
                    renderDetailPanel={
                        renderDetailPanel
                            ? ({ row }) => (
                                <Box sx={{ py: 2, px: 2, bgcolor: '#fafafa' }}>
                                    {renderDetailPanel(row.original)}
                                </Box>
                            )
                            : undefined
                    }
                    renderTopToolbarCustomActions={
                        toolbarActions.length
                            ? () => (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {toolbarActions.map((action) => (
                                        <Button
                                            key={action.key}
                                            variant={action.variant || 'text'}
                                            size={action.size || 'medium'}
                                            startIcon={action.startIcon}
                                            onClick={action.onClick}
                                            color={action.color}
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </Box>
                            )
                            : undefined
                    }
                    muiTablePaperProps={{ elevation: 0, sx: { border: '1px solid #e0e0e0' } }}
                    initialState={initialState}
                />
            </Paper>

            <Dialog open={confirmState.open} onClose={handleCloseDialog}>
                <DialogTitle>{confirmState.action?.confirmTitle || 'Confirm Action'}</DialogTitle>
                <DialogContent>
                    {confirmState.action?.getConfirmMessage
                        ? confirmState.action.getConfirmMessage(confirmState.record)
                        : 'Are you sure you want to proceed?'}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        color={confirmState.action?.color || 'primary'}
                        variant="contained"
                        onClick={handleConfirm}
                    >
                        {confirmState.action?.confirmButtonLabel || 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {snackbar && (
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={onCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert severity={snackbar.severity} onClose={onCloseSnackbar}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
};

export default MasterListMUI;