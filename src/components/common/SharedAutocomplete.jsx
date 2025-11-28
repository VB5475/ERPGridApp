import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

const mergeSx = (base, override) => {
    if (!base) return override;
    if (!override) return base;

    const toStyleObject = (input, theme) => (
        typeof input === 'function'
            ? input(theme)
            : Array.isArray(input)
                ? input.reduce((acc, item) => ({ ...acc, ...(typeof item === 'function' ? item(theme) : item) }), {})
                : input
    );

    if (typeof base === 'function' || typeof override === 'function') {
        return (theme) => ({
            ...(toStyleObject(base, theme) || {}),
            ...(toStyleObject(override, theme) || {}),
        });
    }

    if (Array.isArray(base) || Array.isArray(override)) {
        return [base, override].flat().filter(Boolean);
    }

    return { ...base, ...override };
};

export const SharedAutocomplete = ({
    options = [],
    value = null,
    onChange,
    getOptionLabel = () => '',
    disabled = false,
    placeholder = '',
    label,
    required = false,
    size = 'medium',
    width,
    autoFocus = false,
    inputRef = null,
    textFieldSx,
    autocompleteSx,
    inputLabelProps,
    slotProps,
    renderInput,
    ...autocompleteProps
}) => {
    const widthSx = width ? { width } : undefined;
    const combinedAutocompleteSx = mergeSx(widthSx, autocompleteSx);

    const defaultRenderInput = (params) => (
        <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            autoFocus={autoFocus}
            inputRef={inputRef}
            InputLabelProps={inputLabelProps}
            sx={textFieldSx}
        />
    );

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={onChange}
            getOptionLabel={getOptionLabel}
            disabled={disabled}
            size={size}
            slotProps={slotProps}
            renderInput={renderInput || defaultRenderInput}
            sx={combinedAutocompleteSx}
            {...autocompleteProps}
        />
    );
};



export const MultiAutocompleteFilter = ({ column, options, label }) => {
    const selectedValues = column.getFilterValue() ?? [];

    return (
        <Autocomplete
            multiple
            options={options}
            value={selectedValues}
            onChange={(_, newValue) => column.setFilterValue(newValue.length ? newValue : undefined)}
            renderInput={(params) => (
                <TextField {...params} label={label || 'Filter'} size="small" placeholder="Select..." />
            )}
            filterSelectedOptions
            fullWidth
            disableCloseOnSelect
        />
    );
};