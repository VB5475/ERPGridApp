import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    Typography,
    CircularProgress,
    Alert,
    Snackbar,
    Fade,
    Autocomplete,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useHistory, useParams } from 'react-router-dom';
import SalesOrderGridMUI from './SalesOrderGridMUI';

const SalesOrderFormMUI = () => {
    const history = useHistory();
    const { id } = useParams();
    const isEditMode = id && id !== 'new';

    const [formData, setFormData] = useState({
        soNumber: 'Auto',
        soDate: new Date().toISOString().split('T')[0],
        division: null,
        soType: null,
        customer: null,
    });

    const [divisions, setDivisions] = useState([]);
    const [soTypes, setSOTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [soId, setSoId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const gridRef = useRef(null);

    useEffect(() => {
        fetchDivisions();

        // Load existing SO data if in edit mode
        if (isEditMode) {
            loadSalesOrder(Number(id));
        }
    }, [id, isEditMode]);

    const loadSalesOrder = async (soIdNumber) => {
        try {
            setInitialLoading(true);
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_Select&IDNumber=${soIdNumber}`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const soData = data[0];
                setSoId(soIdNumber);

                // Set form data with loaded values
                setFormData({
                    soNumber: soData.SONo || 'Auto',
                    soDate: soData.SODate ? formatDateForInput(soData.SODate) : new Date().toISOString().split('T')[0],
                    division: { DivisionID: soData.DivisionID, DivisionName: soData.Division },
                    soType: { SOTypeID: soData.SOTypeID, SOType: soData.SOType },
                    customer: { CustomerId: soData.CustomerID, CustCodeName: soData.CustomerName },
                });

                // Load dependent dropdowns
                if (soData.DivisionID) {
                    await fetchSOTypes(soData.DivisionID);
                    await fetchCustomers(soData.DivisionID);
                }
            }
        } catch (error) {
            showSnackbar('Error loading sales order: ' + error.message, 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const formatDateForInput = (dateStr) => {
        // Convert "M/D/YYYY" or "MM/DD/YYYY" to "YYYY-MM-DD"
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const month = parts[0].padStart(2, '0'); // Month
                const day = parts[1].padStart(2, '0');   // Day
                const year = parts[2];                    // Year
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        return new Date().toISOString().split('T')[0];
    };

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetSalesDivision'
            );
            const data = await response.json();
            setDivisions(data || []);
        } catch (error) {
            showSnackbar('Error fetching divisions: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSOTypes = async (divisionId) => {
        if (!divisionId) {
            setSOTypes([]);
            return;
        }
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetSOType&DivID=${divisionId}`
            );
            const data = await response.json();
            setSOTypes(data || []);
        } catch (error) {
            showSnackbar('Error fetching SO types: ' + error.message, 'error');
        }
    };

    const fetchCustomers = async (divisionId) => {
        if (!divisionId) {
            setCustomers([]);
            return;
        }
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=fetch_Sal_GetCustDivWs&DivID=${divisionId}`
            );
            const data = await response.json();
            setCustomers(data || []);
        } catch (error) {
            showSnackbar('Error fetching customers: ' + error.message, 'error');
        }
    };

    const handleDivisionChange = (_event, newValue) => {
        setFormData(prev => ({
            ...prev,
            division: newValue,
            soType: null,
            customer: null
        }));
        if (newValue) {
            fetchSOTypes(newValue.DivisionID);
            fetchCustomers(newValue.DivisionID);
        }
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSave = async () => {
        if (!formData.soDate || !formData.division || !formData.soType || !formData.customer) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            const formattedDate = formatDate(formData.soDate);
            const payload = [{
                IDNumber: isEditMode ? Number(id) : 0,
                SONo: isEditMode ? formData.soNumber : "",
                SODate: formattedDate,
                SOTypeID: formData.soType.SOTypeID,
                CustomerID: formData.customer.CustomerId,
                YearID: 1,
                DivisionID: formData.division.DivisionID,
                LoginID: 1
            }];

            const apiUrl = `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?OP=SAL_SalesOrderMaster_Save&json=${encodeURIComponent(JSON.stringify(payload))}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.length > 0 && data[0].ErrCode === "1") {
                setFormData(prev => ({ ...prev, soNumber: data[0].SONO }));
                showSnackbar(
                    `Sales Order #${data[0].SONO} ${isEditMode ? 'updated' : 'saved'} successfully!`,
                    'success'
                );

                if (!isEditMode) {
                    setSoId(data[0]?.IDNumber);
                    setTimeout(() => {
                        gridRef.current?.focusAddButton();
                    }, 300);
                }
            } else {
                showSnackbar(data?.[0]?.ErrMsg || 'Error saving sales order', 'error');
            }



        } catch (error) {
            showSnackbar('Error saving sales order: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        history.push('/');
    };

    if (initialLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress size={50} thickness={4} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                py: 3,
                px: 2,
            }}
        >
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
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748b',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            {isEditMode ? 'Update sales order details' : 'Create and manage sales orders efficiently'}
                        </Typography>
                    </Box>

                    {loading && !initialLoading ? (
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
                                    <Grid item xs={12} sm={6} size={6}>
                                        <TextField
                                            fullWidth
                                            label="SO Number"
                                            value={formData.soNumber}
                                            InputProps={{
                                                readOnly: true,
                                            }}
                                            InputLabelProps={{
                                                sx: {
                                                    fontWeight: 600,
                                                    color: '#334155',
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                            sx={{
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
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} size={6}>
                                        <TextField
                                            fullWidth
                                            label="SO Date"
                                            type="date"
                                            value={formData.soDate}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                soDate: e.target.value
                                            }))}
                                            InputLabelProps={{
                                                shrink: true,
                                                sx: {
                                                    fontWeight: 600,
                                                    color: '#334155',
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                            required
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
                                                    py: 1.25,
                                                    fontWeight: 500
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4} size={4}>
                                        <Autocomplete
                                            options={divisions}
                                            value={formData.division}
                                            onChange={handleDivisionChange}
                                            getOptionLabel={(option) => option.DivisionName}
                                            disabled={loading}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Division"
                                                    placeholder="Select division"
                                                    required
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
                                    </Grid>

                                    <Grid item xs={12} sm={4} size={4}>
                                        <Autocomplete
                                            options={soTypes}
                                            value={formData.soType}
                                            onChange={(_event, newValue) => setFormData(prev => ({
                                                ...prev,
                                                soType: newValue
                                            }))}
                                            getOptionLabel={(option) => option.SOType}
                                            disabled={!formData.division || loading}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="SO Type"
                                                    placeholder="Select SO type"
                                                    required
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
                                    </Grid>

                                    <Grid item xs={12} sm={4} size={4}>
                                        <Autocomplete
                                            options={customers}
                                            value={formData.customer}
                                            onChange={(_event, newValue) => setFormData(prev => ({
                                                ...prev,
                                                customer: newValue
                                            }))}
                                            getOptionLabel={(option) => option.CustCodeName}
                                            disabled={!formData.division || loading}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Customer"
                                                    placeholder="Select customer"
                                                    required
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
                                    </Grid>
                                </Grid>
                            </Box>

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
                                    onClick={handleBack}
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
                                    onClick={handleSave}
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

                            {(soId || isEditMode) && (
                                <Box sx={{ mt: 3 }}>
                                    {/* SalesOrderGridMUI component would go here */}
                                    <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                                        <SalesOrderGridMUI soId={soId} />
                                    </Typography>
                                </Box>
                            )}

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