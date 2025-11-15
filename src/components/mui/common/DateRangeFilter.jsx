// components/DateRangeFilter.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl } from '@mui/material';
import { getDateRange } from '../../../utils/dateUtils';

const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'past_week', label: 'Past Week' },
    { value: 'past_month', label: 'Past Month' },
    { value: 'past_6_months', label: 'Past 6 Months' },
    { value: 'past_year', label: 'Past Year' },
    { value: 'custom', label: 'Custom Range' }
];

const DateRangeFilter = ({ column }) => {
    const [rangeType, setRangeType] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const handleRangeChange = (type) => {
        setRangeType(type);
        if (type === 'all') {
            column.setFilterValue(undefined);
        } else if (type !== 'custom') {
            column.setFilterValue(getDateRange(type));
        }
    };

    const handleCustomDateApply = () => {
        if (customStartDate && customEndDate) {
            column.setFilterValue(getDateRange('custom', customStartDate, customEndDate));
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 290 }}>
            <FormControl size="small" fullWidth>
                <Select
                    value={rangeType}
                    onChange={(e) => handleRangeChange(e.target.value)}
                    displayEmpty
                >
                    {DATE_RANGE_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {rangeType === 'custom' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleCustomDateApply}
                        fullWidth
                        disabled={!customStartDate || !customEndDate}
                    >
                        Apply
                    </Button>
                </Box>
            )}
        </Box>
    );
};
export default DateRangeFilter