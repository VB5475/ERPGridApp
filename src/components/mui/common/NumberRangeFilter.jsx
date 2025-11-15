// components/NumberRangeFilter.jsx
import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

const NumberRangeFilter = ({ column }) => {
    const [fromValue, setFromValue] = useState('');
    const [toValue, setToValue] = useState('');

    const handleApply = () => {
        column.setFilterValue(
            fromValue !== '' || toValue !== ''
                ? { from: fromValue, to: toValue }
                : undefined
        );
    };

    const handleClear = () => {
        setFromValue('');
        setToValue('');
        column.setFilterValue(undefined);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 150 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="From"
                    type="number"
                    size="small"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                />
                <TextField
                    label="To"
                    type="number"
                    size="small"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={handleApply} fullWidth>
                    Apply
                </Button>
                <Button size="small" variant="outlined" onClick={handleClear} fullWidth>
                    Clear
                </Button>
            </Box>
        </Box>
    );
};

export default NumberRangeFilter