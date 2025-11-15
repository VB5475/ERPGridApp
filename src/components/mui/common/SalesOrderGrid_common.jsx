// components/OrderDetailRow.jsx
import React from 'react';
import { TableRow, TableCell, Typography, Chip, IconButton, Tooltip, Zoom, CircularProgress, Autocomplete, TextField } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { calculateAmount } from '../../../utils/validationUtils';

export const OrderDetailRow = ({ row, readOnly, onEdit, onDelete, disabled }) => (
    <TableRow
        hover
        sx={{
            '&:hover': { bgcolor: '#f8fafc' },
            transition: 'background-color 0.15s ease',
        }}
    >
        <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.MainGroup}</TableCell>
        <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.SubMainGroup}</TableCell>
        <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.ItemName}</TableCell>
        <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.Unit}</TableCell>
        <TableCell align="center">
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                {row.Qty}
            </Typography>
        </TableCell>
        <TableCell align="center">
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                {row.Rate.toFixed(2)}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Chip
                label={`₹ ${row.Amount.toFixed(2)}`}
                color="success"
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
            />
        </TableCell>
        {!readOnly && (
            <TableCell align="center" sx={{ width: 100 }}>
                <Tooltip title="Edit" TransitionComponent={Zoom}>
                    <IconButton
                        color="primary"
                        size="small"
                        onClick={() => onEdit(row)}
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
                        onClick={() => onDelete(row)}
                        disabled={disabled}
                        sx={{ p: 0.5, ml: 0.5 }}
                    >
                        <DeleteIcon sx={{ fontSize: '1.125rem' }} />
                    </IconButton>
                </Tooltip>
            </TableCell>
        )}
    </TableRow>
);

export const EditableRow = ({
    row,
    setRow,
    mainGroups,
    subMainGroups,
    items,
    units,
    onMainGroupChange,
    onSubMainGroupChange,
    onItemChange,
    onUnitChange,
    onSave,
    onCancel,
    saving,
    readOnly,
    autoFocus = false,
    inputRef = null
}) => (
    <TableRow sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-root': { py: 1.25 } }}>
        <TableCell>
            <EditableAutocomplete
                options={mainGroups}
                value={mainGroups.find(g => g.MainGroupID === row.MainGroupID) || null}
                onChange={onMainGroupChange}
                getOptionLabel={(option) => option.MainGroup}
                width={160}
                autoFocus={autoFocus}
                inputRef={inputRef}
            />
        </TableCell>
        <TableCell>
            <EditableAutocomplete
                options={subMainGroups}
                value={subMainGroups.find(g => g.SubMainGroupID === row.SubMainGroupID) || null}
                onChange={onSubMainGroupChange}
                getOptionLabel={(option) => option.SubMianGroup}
                disabled={!row.MainGroupID}
                width={160}
            />
        </TableCell>
        <TableCell>
            <EditableAutocomplete
                options={items}
                value={items.find(i => i.ItemID === row.ItemID) || null}
                onChange={onItemChange}
                getOptionLabel={(option) => option.ItemName}
                disabled={!row.SubMainGroupID}
                width={140}
            />
        </TableCell>
        <TableCell>
            <EditableAutocomplete
                options={units}
                value={units.find(u => u.UnitID === row.UnitID) || null}
                onChange={onUnitChange}
                getOptionLabel={(option) => option.Unit}
                disabled={!row.ItemID}
                width={100}
            />
        </TableCell>
        <TableCell align="center">
            <EditableNumberField
                value={row.Qty}
                onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0;
                    setRow((prev) => prev ? ({
                        ...prev,
                        Qty: qty,
                        Amount: calculateAmount(qty, prev.Rate)
                    }) : null);
                }}
                width={80}
                step={0.001}
            />
        </TableCell>
        <TableCell align="center">
            <EditableNumberField
                value={row.Rate}
                onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    setRow((prev) => prev ? ({
                        ...prev,
                        Rate: rate,
                        Amount: calculateAmount(prev.Qty, rate)
                    }) : null);
                }}
                width={90}
                step={0.01}
            />
        </TableCell>
        <TableCell align="right">
            <Chip
                label={row.Amount.toFixed(2)}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26, width: 80 }}
            />
        </TableCell>
        {!readOnly && (
            <TableCell align="center" sx={{ width: 100 }}>
                <Tooltip title="Save" TransitionComponent={Zoom}>
                    <IconButton
                        color="success"
                        size="small"
                        onClick={onSave}
                        disabled={saving}
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
            </TableCell>
        )}
    </TableRow>
);

export const EditableAutocomplete = ({
    options,
    value,
    onChange,
    getOptionLabel,
    disabled = false,
    placeholder = "Select",
    width = 160,
    autoFocus = false,
    inputRef = null
}) => (
    <Autocomplete
        options={options}
        value={value}
        onChange={onChange}
        getOptionLabel={getOptionLabel}
        disabled={disabled}
        size="small"
        sx={{ width }}
        renderInput={(params) => (
            <TextField
                {...params}
                inputRef={inputRef}
                placeholder={placeholder}
                autoFocus={autoFocus}
                sx={{
                    bgcolor: 'white',
                    borderRadius: 1,
                    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                }}
            />
        )}
        slotProps={{
            popper: {
                sx: { width: 'auto!important', minWidth: '200px' },
            },
        }}
    />
);

export const EditableNumberField = ({
    value,
    onChange,
    width = 80,
    min = 0,
    step = 0.001
}) => (
    <TextField
        type="number"
        size="small"
        value={value}
        onChange={onChange}
        inputProps={{ min, step }}
        sx={{
            bgcolor: 'white',
            borderRadius: 1,
            width,
            '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
        }}
    />
);
