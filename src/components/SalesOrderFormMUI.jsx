import React, { useRef } from 'react';
import { Box, Paper, Grid, Typography, CircularProgress, Alert, Snackbar, Fade } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import { useDropdowns, useSalesOrderForm } from '../hooks/SalesOrderForm_hooks';
import { FormTextField, FormAutocomplete, ActionButtons, QuickGuide } from '../components/common/SalesOrderForm_common';
import SalesOrderGridMUI from './SalesOrderGridMUI';
import { FORM_FIELD_CONFIG, AUTOCOMPLETE_CONFIG } from '../constants/formConfig';

const SalesOrderFormMUI = () => {
    const history = useHistory();
    const { id } = useParams();
    const isEditMode = id && id !== 'new';
    const gridRef = useRef(null);

    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const dropdowns = useDropdowns();
    const form = useSalesOrderForm(id, isEditMode, dropdowns, showSnackbar);

    React.useEffect(() => {
        dropdowns.fetchDivisions();
    }, []);

    const handleBack = () => history.push('/');

    if (form.initialLoading) {
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
                            {isEditMode ? 'Edit Sales Order' : 'Sales Order Entry'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                            {isEditMode ? 'Update sales order details' : 'Create and manage sales orders efficiently'}
                        </Typography>
                    </Box>

                    {form.loading && !form.initialLoading ? (
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
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    {FORM_FIELD_CONFIG.map((field) => (
                                        <Grid item key={field.name} {...field.gridSize} size={6}>
                                            <FormTextField
                                                label={field.label}
                                                type={field.type}
                                                value={form.formData[field.name]}
                                                onChange={(e) => form.setFormData(prev => ({
                                                    ...prev,
                                                    [field.name]: e.target.value
                                                }))}
                                                readOnly={field.readOnly}
                                                required={field.required}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>

                                <Grid container spacing={2}>
                                    {AUTOCOMPLETE_CONFIG.map((config) => (
                                        <Grid item key={config.name} {...config.gridSize} size={4}>
                                            <FormAutocomplete
                                                label={config.label}
                                                placeholder={config.placeholder}
                                                value={form.formData[config.name]}
                                                onChange={
                                                    config.name === 'division'
                                                        ? form.handleDivisionChange
                                                        : (_event, newValue) => form.setFormData(prev => ({
                                                            ...prev,
                                                            [config.name]: newValue
                                                        }))
                                                }
                                                options={dropdowns[`${config.name}s`] || dropdowns[config.name === 'soType' ? 'soTypes' : config.name === 'division' ? 'divisions' : 'customers']}
                                                getOptionLabel={(option) => option[config.optionLabel]}
                                                disabled={config.dependsOn ? !form.formData[config.dependsOn] || form.loading : form.loading}
                                                required={config.required}
                                                size={config.size}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            <ActionButtons
                                onBack={handleBack}
                                onSave={() => form.handleSave(gridRef)}
                                loading={form.loading}
                                isEditMode={isEditMode}
                            />

                            {(form.soId || isEditMode) && (
                                <Box sx={{ mt: 3 }}>
                                    <SalesOrderGridMUI ref={gridRef} soId={form.soId} />
                                </Box>
                            )}

                            <QuickGuide isEditMode={isEditMode} />
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

export default SalesOrderFormMUI;