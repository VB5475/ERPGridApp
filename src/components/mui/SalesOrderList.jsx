import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { MaterialReactTable } from 'material-react-table';
import SalesOrderGridMUI from './SalesOrderGridMUI';

const SalesOrderList = () => {
    const [masterData, setMasterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        record: null,
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });
    const history = useHistory();


    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_List'
            );
            const data = await response.json();
            console.log("see master data:", data)
            setMasterData(data || []);
        } catch (error) {
            showSnackbar('Error fetching sales orders: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        history.push(`/sales-order/edit/${row.IDNumber}`);
    };

    const handleAddNew = () => {
        history.push('/sales-order/new');
    };

    const handleDelete = async () => {
        if (!deleteDialog.record) return;
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_Delete&IDNumber=${deleteDialog.record.IDNumber}`
            );
            const result = await response.json();

            if (result?.[0]?.ErrCode === '1' || result?.status === 'success') {
                showSnackbar('Sales order deleted successfully', 'success');
                await fetchMasterData();
                setDeleteDialog({ open: false, record: null });
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error deleting sales order', 'error');
            }
        } catch (error) {
            showSnackbar('Error deleting sales order: ' + error.message, 'error');
        }
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Universal dynamic sorting function that detects data type automatically
    const dynamicSort = (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);

        // Handle null/undefined values
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        // Try to detect if values are dates
        const dateA = new Date(a);
        const dateB = new Date(b);
        const isDateA = !isNaN(dateA.getTime()) && typeof a === 'string' &&
            (a.includes('-') || a.includes('/') || a.includes('T'));
        const isDateB = !isNaN(dateB.getTime()) && typeof b === 'string' &&
            (b.includes('-') || b.includes('/') || b.includes('T'));

        if (isDateA && isDateB) {
            return dateA.getTime() - dateB.getTime();
        }

        // Try to detect if values are pure numbers
        const numA = Number(a);
        const numB = Number(b);

        if (!isNaN(numA) && !isNaN(numB) && typeof a !== 'string' ||
            (!isNaN(numA) && !isNaN(numB) && String(a).trim() === String(numA) && String(b).trim() === String(numB))) {
            return numA - numB;
        }

        // Convert to strings for further analysis
        const strA = String(a);
        const strB = String(b);

        // Check if strings contain numbers (alphanumeric)
        const hasNumbersA = /\d/.test(strA);
        const hasNumbersB = /\d/.test(strB);

        if (hasNumbersA && hasNumbersB) {
            // Alphanumeric sorting: split into text and number parts
            const regex = /(\d+)|(\D+)/g;
            const partsA = strA.match(regex) || [];
            const partsB = strB.match(regex) || [];

            const maxLength = Math.max(partsA.length, partsB.length);

            for (let i = 0; i < maxLength; i++) {
                const partA = partsA[i] || '';
                const partB = partsB[i] || '';

                // Both parts are numbers
                const isNumPartA = /^\d+$/.test(partA);
                const isNumPartB = /^\d+$/.test(partB);

                if (isNumPartA && isNumPartB) {
                    const diff = parseInt(partA) - parseInt(partB);
                    if (diff !== 0) return diff;
                } else {
                    // String comparison
                    const comparison = partA.localeCompare(partB, undefined, {
                        sensitivity: 'base',
                        numeric: true
                    });
                    if (comparison !== 0) return comparison;
                }
            }

            return 0;
        }

        // Default: string comparison with natural sorting
        return strA.localeCompare(strB, undefined, {
            sensitivity: 'base',
            numeric: true
        });
    };

    // Custom "contains" filter function for all columns
    const containsFilterFn = (row, id, filterValue) => {
        const cellValue = row.getValue(id);
        if (cellValue == null) return false;

        const searchValue = String(filterValue).toLowerCase();
        const cellString = String(cellValue).toLowerCase();

        return cellString.includes(searchValue);
    };

    // Generate columns dynamically from data
    const columns = useMemo(() => {
        if (!masterData?.length) return [];
        const excludedKeys = ['Division', "CreatedDate", "CreatedBy", "UpdatedBy", "UpdatedDate"];

        return Object.keys(masterData[0])
            .filter(key => !excludedKeys.includes(key))
            .map(key => {
                const lowerKey = key.toLowerCase();
                const isDateField = lowerKey.includes('date') || lowerKey.includes('time');
                const isKeyField = lowerKey.includes('no') || lowerKey.includes('id');
                const trimmedKey = key?.trim();

                // Helper function to format cell value consistently
                const formatCellValue = (val) => {
                    if (val == null || val === '') return '';

                    if (isDateField) {
                        const date = new Date(val);
                        if (!isNaN(date.getTime())) {
                            // Check if the original value contains time components
                            const hasTime = String(val).includes(':') ||
                                String(val).includes('T') ||
                                String(val).includes('AM') ||
                                String(val).includes('PM');

                            return hasTime || lowerKey.includes('time') || lowerKey.includes('updated')
                                ? date.toLocaleString()
                                : date.toLocaleDateString();
                        }
                    }
                    return String(val);
                };

                // Get unique values for this column (format dates for filtering)
                const uniqueValues = [...new Set(
                    masterData
                        .map(row => formatCellValue(row[key]))
                        .filter(val => val !== '')
                )].sort((a, b) => {
                    // Sort unique values for better UX
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                });

                return {
                    accessorKey: trimmedKey,
                    header: trimmedKey,
                    size: 20,
                    sortingFn: dynamicSort,
                    // Enable autocomplete filter with unique values for searchable dropdowns
                    filterVariant: uniqueValues.length <= 100 ? 'autocomplete' : 'text',
                    filterSelectOptions: uniqueValues.length <= 100
                        ? uniqueValues
                        : undefined,
                    // Use contains filter for text fields
                    filterFn: uniqueValues.length > 100 ? containsFilterFn : (row, id, filterValue) => {
                        const cellValue = row.getValue(id);
                        const formattedValue = formatCellValue(cellValue);

                        // Handle array of filter values (for autocomplete multi-select)
                        if (Array.isArray(filterValue)) {
                            return filterValue.includes(formattedValue);
                        }

                        // Exact match for single value in autocomplete
                        return formattedValue === filterValue;
                    },
                    Cell: ({ cell }) => {
                        const value = cell.getValue();

                        if (value == null || value === '') return '';
                        if (isDateField) {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                                // Check if the original value contains time components
                                const hasTime = String(value).includes(':') ||
                                    String(value).includes('T') ||
                                    String(value).includes('AM') ||
                                    String(value).includes('PM');

                                return hasTime || lowerKey.includes('time') || lowerKey.includes('updated')
                                    ? date.toLocaleString()
                                    : date.toLocaleDateString();
                            }
                        }
                        if (isKeyField) {
                            return (
                                <Chip
                                    label={value}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                    color="primary"
                                    variant="outlined"
                                />
                            );
                        }
                        return value;
                    },
                };
            });
    }, [masterData]);

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2, bgcolor: '#f5f5f5' }}>
            <Paper
                elevation={3}
                sx={{
                    maxWidth: '1600px',
                    width: '100%',
                    margin: '0 auto',
                    p: 3,
                    borderRadius: 2,
                }}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
                        Sales Order Master
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Manage your sales orders with expandable details
                    </Typography>
                </Box>

                <MaterialReactTable
                    columns={columns}
                    data={masterData}
                    state={{ isLoading: loading }}
                    enableRowActions
                    enableColumnFilterModes={false}
                    enableColumnOrdering={false}
                    enableColumnDragging={false}
                    enableGrouping
                    enablePinning
                    enableColumnResizing={false}
                    enableExpanding
                    enableGlobalFilter={true}
                    enableColumnFilters={true}
                    enableColumnActions={false}
                    positionActionsColumn="last"
                    enableFilterMatchHighlighting={true}
                    muiFilterTextFieldProps={{
                        sx: { minWidth: '150px', padding: 0 },
                        variant: 'outlined',
                        size: 'small',
                        InputProps: {
                            sx: { padding: 0 }
                        }
                    }}
                    muiFilterAutocompleteProps={{
                        sx: {
                            minWidth: '150px',
                            '& .MuiInputBase-root': {
                                padding: '0 !important',
                            },
                            '& .MuiAutocomplete-inputRoot': {
                                padding: '4px !important',
                            }
                        },
                        size: 'small',
                    }}
                    renderRowActions={({ row }) => (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEdit(row.original)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                        setDeleteDialog({ open: true, record: row.original })
                                    }
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                    renderDetailPanel={({ row }) => (
                        <Box sx={{ py: 2, px: 2, bgcolor: '#fafafa' }}>
                            <SalesOrderGridMUI soId={row.original.IDNumber} readOnly={true} />
                        </Box>
                    )}
                    renderTopToolbarCustomActions={() => (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={fetchMasterData}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddNew}
                            >
                                Add New
                            </Button>
                        </Box>
                    )}
                    muiTablePaperProps={{
                        elevation: 0,
                        sx: { border: '1px solid #e0e0e0' },
                    }}
                    initialState={{
                        pagination: { pageSize: 10, pageIndex: 0 },
                        density: 'comfortable',
                        showColumnFilters: true,
                    }}
                />
            </Paper>

            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, record: null })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete Sales Order{' '}
                    <strong>{deleteDialog.record?.SONo}</strong>?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, record: null })}>
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SalesOrderList;