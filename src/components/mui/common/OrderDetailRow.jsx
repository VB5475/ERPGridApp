// components/OrderDetailRow.jsx
import React from 'react';
import { TableRow, TableCell, Typography, Chip, IconButton, Tooltip, Zoom } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
