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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
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

    // Date range filter component
    const DateRangeFilter = ({ column }) => {
        const [rangeType, setRangeType] = useState('all');
        const [customStartDate, setCustomStartDate] = useState('');
        const [customEndDate, setCustomEndDate] = useState('');

        const getDateRange = (type) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let startDate = new Date(today);

            switch (type) {
                case 'today':
                    return { start: today, end: new Date() };
                case 'yesterday':
                    startDate.setDate(today.getDate() - 1);
                    return { start: startDate, end: new Date(startDate.getTime() + 86400000 - 1) };
                // case 'past_week':
                //     startDate.setDate(today.getDate() - 7);
                //     return { start: startDate, end: new Date() };
                case 'past_week': {
                    const now = new Date();

                    // Get Monday of current week
                    const currentWeekDay = now.getDay(); // Sunday=0, Monday=1
                    const mondayThisWeek = new Date(now);
                    mondayThisWeek.setDate(now.getDate() - ((currentWeekDay + 6) % 7));

                    // Previous full week
                    const start = new Date(mondayThisWeek);
                    start.setDate(start.getDate() - 7);

                    const end = new Date(mondayThisWeek);
                    end.setDate(end.getDate() - 1); // Sunday of last week

                    return { start, end };
                }

                case 'past_month':
                    // const date = startDate.setMonth(today.getMonth() - 1);
                    // console.log("see date:", new Date(date))
                    // return { start: startDate, end: new Date() };
                    const year = today.getFullYear();
                    const month = today.getMonth(); // November=10, October=9

                    // Previous month calculation
                    const prevMonth = month - 1;

                    const start = new Date(year, prevMonth, 1); // 1st of previous month
                    const end = new Date(year, month, 0); // Last date of previous month

                    return { start, end };
                // case 'past_6_months':
                //     startDate.setMonth(today.getMonth() - 6);
                //     return { start: startDate, end: new Date() };
                case 'past_6_months': {
                    const year = today.getFullYear();
                    const month = today.getMonth(); // 0-indexed

                    const end = new Date(year, month, 0); // last day of previous month
                    const start = new Date(year, month - 6, 1); // first of 6 months before last month

                    return { start, end };
                }
                // case 'past_year':
                //     startDate.setFullYear(today.getFullYear() - 1);
                //     return { start: startDate, end: new Date() };
                case 'past_year': {
                    const year = today.getFullYear();

                    const start = new Date(year - 1, 0, 1);   // Jan 1 last year
                    const end = new Date(year - 1, 11, 31);   // Dec 31 last year

                    return { start, end };
                }
                case 'custom':
                    if (customStartDate && customEndDate) {
                        return {
                            start: new Date(customStartDate),
                            end: new Date(customEndDate + 'T23:59:59')
                        };
                    }
                    return null;
                default:
                    return null;
            }
        };

        const handleRangeChange = (type) => {
            setRangeType(type);
            if (type === 'all') {
                column.setFilterValue(undefined);
            } else if (type !== 'custom') {
                const range = getDateRange(type);
                column.setFilterValue(range);
            }
        };

        const handleCustomDateApply = () => {
            if (customStartDate && customEndDate) {
                const range = getDateRange('custom');
                column.setFilterValue(range);
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
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                        <MenuItem value="past_week">Past Week</MenuItem>
                        <MenuItem value="past_month">Past Month</MenuItem>
                        <MenuItem value="past_6_months">Past 6 Months</MenuItem>
                        <MenuItem value="past_year">Past Year</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                    </Select>
                </FormControl>
                {rangeType === 'custom' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: "100%" }}>

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
                            sx={{ width: "100%" }}
                            disabled={!customStartDate || !customEndDate}
                        >
                            Apply
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    // Number range filter component
    const NumberRangeFilter = ({ column }) => {
        const [fromValue, setFromValue] = useState('');
        const [toValue, setToValue] = useState('');

        const handleApply = () => {
            if (fromValue !== '' || toValue !== '') {
                column.setFilterValue({ from: fromValue, to: toValue });
            } else {
                column.setFilterValue(undefined);
            }
        };

        const handleClear = () => {
            setFromValue('');
            setToValue('');
            column.setFilterValue(undefined);
        };

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 150 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, }}>
                    <TextField
                        label="From"
                        type="number"
                        size="small"
                        value={fromValue}
                        // sx={{ width: "100%" }}
                        onChange={(e) => setFromValue(e.target.value)}
                    />
                    <TextField
                        label="To"
                        type="number"
                        size="small"
                        value={toValue}
                        // sx={{ width: "100%" }}
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

    // Date range filter function
    const dateRangeFilterFn = (row, columnId, filterValue) => {
        if (!filterValue || !filterValue.start || !filterValue.end) return true;

        const cellValue = row.getValue(columnId);
        if (!cellValue) return false;

        const cellDate = new Date(cellValue);
        if (isNaN(cellDate.getTime())) return false;

        // Normalize dates to compare only date parts (ignore time)
        const cellDateOnly = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        const startDateOnly = new Date(filterValue.start.getFullYear(), filterValue.start.getMonth(), filterValue.start.getDate());
        const endDateOnly = new Date(filterValue.end.getFullYear(), filterValue.end.getMonth(), filterValue.end.getDate());

        return cellDateOnly >= startDateOnly && cellDateOnly <= endDateOnly;
    };

    // Number range filter function
    const numberRangeFilterFn = (row, columnId, filterValue) => {
        if (!filterValue || (filterValue.from === '' && filterValue.to === '')) return true;

        const cellValue = row.getValue(columnId);
        const numValue = Number(cellValue);

        if (isNaN(numValue)) return false;

        const from = filterValue.from !== '' ? Number(filterValue.from) : -Infinity;
        const to = filterValue.to !== '' ? Number(filterValue.to) : Infinity;

        return numValue >= from && numValue <= to;
    };

    // Universal dynamic sorting function
    const dynamicSort = (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);

        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        const dateA = new Date(a);
        const dateB = new Date(b);
        const isDateA = !isNaN(dateA.getTime()) && typeof a === 'string' &&
            (a.includes('-') || a.includes('/') || a.includes('T'));
        const isDateB = !isNaN(dateB.getTime()) && typeof b === 'string' &&
            (b.includes('-') || b.includes('/') || b.includes('T'));

        if (isDateA && isDateB) {
            return dateA.getTime() - dateB.getTime();
        }

        const numA = Number(a);
        const numB = Number(b);

        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        return String(a).localeCompare(String(b), undefined, {
            sensitivity: 'base',
            numeric: true
        });
    };

    // Custom "contains" filter function
    const containsFilterFn = (row, id, filterValue) => {
        const cellValue = row.getValue(id);
        if (cellValue == null) return false;

        const searchValue = String(filterValue).toLowerCase();
        const cellString = String(cellValue).toLowerCase();

        return cellString.includes(searchValue);
    };

    // Generate columns dynamically with custom filters
    const columns = useMemo(() => {
        if (!masterData?.length) return [];

        // Only show these columns
        const includedKeys = ['IDNumber', 'SONo', 'SODate', 'SOType', 'CustomerName'];

        return includedKeys.map(key => {
            const lowerKey = key.toLowerCase();
            const isDateField = key === 'SODate';
            const isNumberRangeField = key === 'SONo' || key === 'IDNumber';
            const trimmedKey = key?.trim();

            const formatCellValue = (val) => {
                if (val == null || val === '') return '';

                if (isDateField) {
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString();
                    }
                }
                return String(val);
            };

            // Get unique values for autocomplete filters (for non-custom filter columns)
            const uniqueValues = !isDateField && !isNumberRangeField
                ? [...new Set(
                    masterData
                        .map(row => formatCellValue(row[key]))
                        .filter(val => val !== '')
                )].sort((a, b) => {
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                })
                : [];

            // Configure column based on type
            let columnConfig = {
                accessorKey: trimmedKey,
                header: trimmedKey,
                size: key === 'IDNumber' ? 100 : 150,
                sortingFn: dynamicSort,
                Cell: ({ cell }) => {
                    const value = cell.getValue();

                    if (value == null || value === '') return '';

                    if (isDateField) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString();
                        }
                    }

                    if (isNumberRangeField) {
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

            // Add custom filter configurations
            if (isDateField) {
                columnConfig.Filter = ({ column }) => <DateRangeFilter column={column} />;
                columnConfig.filterFn = dateRangeFilterFn;
            } else if (isNumberRangeField) {
                columnConfig.Filter = ({ column }) => <NumberRangeFilter column={column} />;
                columnConfig.filterFn = numberRangeFilterFn;
            } else {
                // Use autocomplete for other columns
                columnConfig.filterVariant = uniqueValues.length <= 100 ? 'autocomplete' : 'text';
                columnConfig.filterSelectOptions = uniqueValues.length <= 100 ? uniqueValues : undefined;
                columnConfig.filterFn = uniqueValues.length > 100 ? containsFilterFn : undefined;
            }

            return columnConfig;
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