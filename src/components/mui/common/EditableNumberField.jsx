// components/EditableNumberField.jsx
import React from 'react';
import { TextField } from '@mui/material';

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
