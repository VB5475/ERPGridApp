import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    CircularProgress,
    Tooltip,
    IconButton,
    TextField,
    Zoom
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

const defaultHeaderCellSx = { fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 };

const MasterGrid = forwardRef(({
    title,
    subtitle,
    recordLabel,
    recordValue,
    addButtonLabel = 'Add Record',
    readOnly = false,
    initialLoading = false,
    isBusy = false,
    rows = [],
    rowKeyAccessor = (row) => row?.id,
    newRow = null,
    editingRow = null,
    editingRowId = null,
    savingRowId = null,
    tableHeaders = [],
    renderNewRow,
    renderEditRow,
    renderDisplayRow,
    renderEmptyState,
    renderSummaryRow,
    onStartNew,
    onSaveNew,
    onCancelNew,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteRequest,
    onUpdateNewRow,
    onUpdateEditingRow,
    snackbar,
    onCloseSnackbar,
    deleteDialog,
    onCloseDeleteDialog,
    onConfirmDelete,
    deleting = false,
    tableProps = {},
    containerProps = {},
    summaryProps = {}
}, ref) => {
    const addButtonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focusAddButton: () => {
            setTimeout(() => {
                addButtonRef.current?.focus();
                addButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }), []);


    if (initialLoading) {
        return (
            <Paper
                elevation={2}
                sx={{ p: 3, mt: 2.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
                        Loading details...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const isActionDisabled = Boolean(newRow) || editingRowId !== null || isBusy || savingRowId !== null;
    const headers = tableHeaders.filter(Boolean);

    return (
        <Paper
            elevation={2}
            sx={{ p: 2.5, mt: 2.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            {...containerProps}
        >
            {(title || subtitle || recordLabel) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        {title && (
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
                                {title}
                            </Typography>
                        )}
                        {(subtitle || recordValue != null) && (
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {subtitle || (recordLabel ? `${recordLabel}: ${recordValue ?? '—'}` : '')}
                            </Typography>
                        )}
                    </Box>
                    {!readOnly && (
                        <Button
                            ref={addButtonRef}
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onStartNew}
                            disabled={isActionDisabled}
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
                            {addButtonLabel}
                        </Button>
                    )}
                </Box>
            )}

            <TableContainer sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Table size="small" {...tableProps}>
                    {headers.length > 0 && (
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {headers.map((header) => (
                                    <TableCell
                                        key={header.key || header.label}
                                        align={header.align || 'left'}
                                        sx={{ ...defaultHeaderCellSx, ...(header.sx || {}) }}
                                    >
                                        {header.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                    )}
                    <TableBody>
                        {newRow && renderNewRow && renderNewRow({
                            row: newRow,
                            setRow: onUpdateNewRow,
                            save: onSaveNew,
                            cancel: onCancelNew,
                            saving: savingRowId === 'new',
                            readOnly,
                            disabled: isActionDisabled
                        })}

                        {rows.length === 0 && !newRow
                            ? (renderEmptyState?.({ readOnly }) ?? (
                                <TableRow>
                                    <TableCell colSpan={headers.length || 1} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary" variant="body2">
                                            No records available.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                            : rows.map((row) => {
                                const key = rowKeyAccessor(row);
                                if (editingRowId !== null && key === editingRowId && renderEditRow) {
                                    return renderEditRow({
                                        key,
                                        row: editingRow,
                                        setRow: onUpdateEditingRow,
                                        save: onSaveEdit,
                                        cancel: onCancelEdit,
                                        saving: savingRowId === editingRowId,
                                        readOnly,
                                        disabled: isActionDisabled
                                    });
                                }
                                return renderDisplayRow?.({
                                    key,
                                    row,
                                    readOnly,
                                    disabled: isActionDisabled,
                                    onEdit: () => onStartEdit?.(row),
                                    onDelete: () => onDeleteRequest?.(row)
                                });
                            })}

                        {rows.length > 0 && renderSummaryRow && renderSummaryRow({ rows, readOnly, ...summaryProps })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={deleteDialog?.open || false}
                onClose={onCloseDeleteDialog}
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                    {deleteDialog?.title || 'Confirm Delete'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.875rem' }}>
                        {deleteDialog?.description || 'Are you sure you want to delete this record? This action cannot be undone.'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={onCloseDeleteDialog}
                        disabled={deleting}
                        sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        {deleteDialog?.cancelLabel || 'Cancel'}
                    </Button>
                    <Button
                        onClick={() => onConfirmDelete?.(deleteDialog?.row)}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                        {deleting ? 'Deleting...' : (deleteDialog?.confirmLabel || 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {snackbar?.message && (<Snackbar
                open={snackbar?.open || false}
                autoHideDuration={3500}
                onClose={onCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar?.severity || 'info'}
                    onClose={onCloseSnackbar}
                    sx={{ borderRadius: 2, fontSize: '0.875rem' }}
                >
                    {snackbar?.message}
                </Alert>
            </Snackbar>
            )}
        </Paper>
    );
});

MasterGrid.displayName = 'MasterGrid';

export default MasterGrid;

// Helper components ----------------------------------------------------------

const defaultActionButtons = ({ row, disabled, onEdit, onDelete }) => (
    <>
        <Tooltip title="Edit" TransitionComponent={Zoom}>
            <IconButton
                color="primary"
                size="small"
                onClick={() => onEdit?.(row)}
                disabled={disabled}
                sx={{ p: 0.5 }}
            >
                <EditIcon sx={{ fontSize: '1.125rem' }} />
            </IconButton>
        </Tooltip>
        <Tooltip title="Delete" TransitionComponent={Zoom}>
            <IconButton
                color="error"
                size="small"
                onClick={() => onDelete?.(row)}
                disabled={disabled}
                sx={{ p: 0.5, ml: 0.5 }}
            >
                <DeleteIcon sx={{ fontSize: '1.125rem' }} />
            </IconButton>
        </Tooltip>
    </>
);

const defaultEditActions = ({ saving, onSave, onCancel, disabled }) => (
    <>
        <Tooltip title="Save" TransitionComponent={Zoom}>
            <IconButton
                color="success"
                size="small"
                onClick={onSave}
                disabled={disabled}
                sx={{ p: 0.5 }}
            >
                {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
            </IconButton>
        </Tooltip>
        <Tooltip title="Cancel" TransitionComponent={Zoom}>
            <IconButton
                color="error"
                size="small"
                onClick={onCancel}
                disabled={saving}
                sx={{ p: 0.5, ml: 0.5 }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    </>
);

export const MasterGridDisplayRow = ({
    columns = [],
    row,
    readOnly,
    disabled,
    onEdit,
    onDelete,
    actionsAlign = 'center',
    renderActions
}) => (
    <TableRow
        hover
        sx={{
            '&:hover': { bgcolor: '#f8fafc' },
            transition: 'background-color 0.15s ease',
        }}
    >
        {columns.map((col, idx) => (
            <TableCell
                key={col.key || idx}
                align={col.align || 'left'}
                sx={col.cellSx}
            >
                {col.render ? col.render(row) : row?.[col.key]}
            </TableCell>
        ))}
        {!readOnly && (
            <TableCell align={actionsAlign} sx={{ width: 110 }}>
                {renderActions
                    ? renderActions({ row, disabled, onEdit, onDelete })
                    : defaultActionButtons({ row, disabled, onEdit, onDelete })}
            </TableCell>
        )}
    </TableRow>
);

export const MasterGridEditableRow = ({
    columns = [],
    row,
    setRow,
    readOnly,
    onSave,
    onCancel,
    saving = false,
    actionsAlign = 'center',
    renderActions,
    disabledActions = false
}) => (
    <TableRow sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-root': { py: 1.25 } }}>
        {columns.map((col, idx) => {
            const autoFocus = col.autoFocus && idx === 0;
            const inputRef = autoFocus ? col.inputRef || null : undefined;
            return (
                <TableCell
                    key={col.key || idx}
                    align={col.align || 'left'}
                    sx={col.cellSx}
                >
                    {col.render
                        ? col.render({
                            row,
                            setRow,
                            autoFocus,
                            inputRef,
                        })
                        : null}
                </TableCell>
            );
        })}
        {!readOnly && (
            <TableCell align={actionsAlign} sx={{ width: 120 }}>
                {renderActions
                    ? renderActions({ row, saving, onSave, onCancel, disabled: disabledActions })
                    : defaultEditActions({ saving, onSave, onCancel, disabled: disabledActions })}
            </TableCell>
        )}
    </TableRow>
);

export const MasterGridEditableNumberField = ({
    value,
    onChange,
    width = 80,
    min = 0,
    step = 0.001
}) => (
    <TextField
        type="number"
        size="small"
        value={value ?? ''}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || 0, e)}
        inputProps={{ min, step }}
        sx={{
            bgcolor: 'white',
            borderRadius: 1,
            width,
            '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
        }}
    />
);

