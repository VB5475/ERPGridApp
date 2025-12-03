import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Alert,
    Snackbar,
    Fade,
    CircularProgress
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { SharedAutocomplete } from './SharedAutocomplete';

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

const FormTextField = ({
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

const QuickGuide = ({ guideItems = [] }) => {
    if (!guideItems?.length) return null;

    return (
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
                {guideItems.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
            </Box>
        </Paper>
    );
};

const ActionButtons = ({ onBack, onSave, loading, isEditMode, saveButtonText }) => (
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
            {saveButtonText || (isEditMode ? 'Update Order' : 'Save & Add Item')}
        </Button>
    </Box>
);

const FormMUI = ({
    title,
    subtitle,
    textFields = [],
    autocompleteFields = [],
    formData = {},
    setFormData,
    dropdowns = {},
    getDropdownOptions = (fieldName) => dropdowns[fieldName] || [],
    getFieldHandler = () => null,
    onSave,
    onBack,
    loading = false,
    initialLoading = false,
    isEditMode = false,
    onShowSnackbarReady,
    guideItems = [],
    saveButtonText,
    children
}) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleShowSnackbar = React.useCallback((message, severity = 'info') => {
        if (message) {
            setSnackbar({ open: true, message, severity });
        }
    }, []);

    React.useEffect(() => {
        if (onShowSnackbarReady) {
            onShowSnackbarReady(handleShowSnackbar);
        }
    }, [onShowSnackbarReady, handleShowSnackbar]);

    if (initialLoading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={50} thickness={4} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2 }}>
            <Fade in timeout={500}>
                <Paper
                    elevation={8}
                    sx={{
                        maxWidth: '1400px',
                        width: '100%',
                        margin: '0 auto',
                        p: { xs: 2.5, sm: 3, md: 3.5 },
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)',
                        }
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700,
                                mb: 0.5,
                                letterSpacing: '-0.5px',
                                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    {loading ? (
                        <Alert
                            severity="info"
                            icon={<CircularProgress size={18} />}
                            sx={{
                                mb: 2.5,
                                borderRadius: 2,
                                background: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                '& .MuiAlert-message': {
                                    fontWeight: 600,
                                    color: '#1e3a8a',
                                    fontSize: '0.875rem'
                                }
                            }}
                        >
                            Loading data...
                        </Alert>
                    ) : (
                        <>
                            <Box sx={{ mb: 2.5 }}>
                                {textFields.length > 0 && (
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        {textFields.map((field) => {
                                            const handler = getFieldHandler(field.name);
                                            return (
                                                <Grid item key={field.name} size={field.gridSize || { xs: 12, sm: 6 }}>
                                                    <FormTextField
                                                        label={field.label}
                                                        type={field.type || 'text'}
                                                        value={formData[field.name] || ''}
                                                        onChange={handler || ((e) => setFormData(prev => ({
                                                            ...prev,
                                                            [field.name]: e.target.value
                                                        })))}
                                                        readOnly={field.readOnly || false}
                                                        required={field.required || false}
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}

                                {autocompleteFields.length > 0 && (
                                    <Grid container spacing={2}>
                                        {autocompleteFields.map((config) => {
                                            const handler = getFieldHandler(config.name);
                                            const options = getDropdownOptions(config.name, config);
                                            const disabled = config.dependsOn
                                                ? !formData[config.dependsOn] || loading
                                                : loading;
                                            return (
                                                <Grid item key={config.name} size={config.gridSize || 4}>
                                                    <SharedAutocomplete
                                                        label={config.label}
                                                        placeholder={config.placeholder || ''}
                                                        value={formData[config.name] || null}
                                                        onChange={handler || ((_event, newValue) => setFormData(prev => ({
                                                            ...prev,
                                                            [config.name]: newValue
                                                        })))}
                                                        options={options}
                                                        getOptionLabel={(option) => option?.[config.optionLabel] || ''}
                                                        disabled={disabled}
                                                        required={config.required || false}
                                                        autocompleteSx={FIELD_STYLES}
                                                        inputLabelProps={{
                                                            sx: LABEL_STYLES
                                                        }}
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}
                            </Box>

                            <ActionButtons
                                onBack={onBack}
                                onSave={onSave}
                                loading={loading}
                                isEditMode={isEditMode}
                                saveButtonText={saveButtonText}
                            />

                            {children}

                            <QuickGuide guideItems={guideItems} />
                        </>
                    )}
                </Paper>
            </Fade>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default FormMUI;