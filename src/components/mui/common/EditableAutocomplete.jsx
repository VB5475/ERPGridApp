// components/EditableAutocomplete.jsx
import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

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
