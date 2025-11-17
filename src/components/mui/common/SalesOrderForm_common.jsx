import React from 'react';
import { TextField, Autocomplete, Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';


const FIELD_STYLES = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '& fieldset': {
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
            transition: 'all 0.2s ease',
        },
        '&:hover fieldset': {
            borderColor: '#cbd5e1',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#3b82f6',
            borderWidth: 2,
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        },
    },
    '& .MuiInputBase-input': {
        fontSize: '0.875rem',
        py: 1.25,
        fontWeight: 500
    }
};

const LABEL_STYLES = {
    fontWeight: 600,
    color: '#334155',
    fontSize: '0.875rem'
};

export const FormTextField = ({
    label,
    value,
    onChange,
    type = 'text',
    readOnly = false,
    required = false,
    ...props
}) => (
    <TextField
        fullWidth
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        InputProps={{ readOnly }}
        InputLabelProps={{
            shrink: type === 'date' ? true : undefined,
            sx: LABEL_STYLES
        }}
        sx={{
            ...FIELD_STYLES,
            ...(readOnly && {
                '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    '& fieldset': {
                        borderWidth: 1.5,
                        borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                        borderColor: '#cbd5e1',
                    },
                },
                '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    py: 1.25,
                    fontWeight: 600,
                    color: '#1e3a8a'
                }
            })
        }}
        {...props}
    />
);


export const FormAutocomplete = ({
    label,
    value,
    onChange,
    options,
    getOptionLabel,
    disabled = false,
    placeholder = '',
    required = false
}) => (
    <Autocomplete
        options={options}
        value={value}
        onChange={onChange}
        getOptionLabel={getOptionLabel}
        disabled={disabled}
        renderInput={(params) => (
            <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                required={required}
                InputLabelProps={{
                    sx: {
                        fontWeight: 600,
                        color: '#334155',
                        fontSize: '0.875rem'
                    }
                }}
            />
        )}
        sx={{
            '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                    borderWidth: 1.5,
                    borderColor: '#e2e8f0',
                    transition: 'all 0.2s ease',
                },
                '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                },
            },
            '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                py: '9px',
                fontWeight: 500
            }
        }}
    />
);


export const QuickGuide = ({ isEditMode }) => (
    <Paper
        elevation={0}
        sx={{
            mt: 2.5,
            p: 2,
            background: 'rgba(59, 130, 246, 0.04)',
            borderLeft: '3px solid #3b82f6',
            borderRadius: 2,
        }}
    >
        <Typography
            variant="subtitle2"
            sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 1,
                fontSize: '0.8125rem',
            }}
        >
            Quick Guide
        </Typography>
        <Box
            component="ul"
            sx={{
                m: 0,
                pl: 2.5,
                '& li': {
                    mb: 0.75,
                    lineHeight: 1.6,
                    fontSize: '0.8125rem',
                    color: '#475569',
                    fontWeight: 500,
                    '& strong': {
                        color: '#1e3a8a',
                        fontWeight: 600
                    }
                }
            }}
        >
            <li>Select a <strong>Division</strong> first to load SO Types and Customers</li>
            <li>SO Number is <strong>auto-generated</strong> after saving</li>
            <li>All fields are required except SO Number</li>
            <li>Click <strong>"{isEditMode ? 'Update Order' : 'Save & Add Item'}"</strong> to proceed</li>
        </Box>
    </Paper>
);


export const ActionButtons = ({ onBack, onSave, loading, isEditMode }) => (
    <Box
        sx={{
            mt: 2.5,
            pt: 2.5,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'center',
            gap: 2
        }}
    >
        <Button
            variant="outlined"
            size="medium"
            onClick={onBack}
            startIcon={<ArrowBackIcon />}
            sx={{
                px: 4,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                letterSpacing: '0.2px',
                minWidth: '200px',
                color: '#1e3a8a',
                borderColor: '#3b82f6',
                '&:hover': {
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderColor: '#1e40af',
                    transform: 'translateY(-1px)',
                },
                '&:active': {
                    transform: 'translateY(0)',
                },
                transition: 'all 0.2s ease',
            }}
        >
            Back to List
        </Button>

        <Button
            variant="contained"
            size="medium"
            onClick={onSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                px: 4,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                letterSpacing: '0.2px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                minWidth: '200px',
                '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                },
                '&:active': {
                    transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    color: 'white',
                    opacity: 0.6,
                },
                transition: 'all 0.2s ease',
            }}
        >
            {isEditMode ? 'Update Order' : 'Save & Add Item'}
        </Button>
    </Box>
);
