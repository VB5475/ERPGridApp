import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl, Chip, Autocomplete } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import MasterListMUI from './common/MasterListMUI';
import SalesOrderGridMUI from './SalesOrderGridMUI';
import { API_BASE } from '../constants/api';
import { dateRangeFilterFn, numberRangeFilterFn, multiSelectFilterFn, dynamicSort } from '../utils/filterUtils';
import { getDateRange } from '../utils/dateUtils';
import { MultiAutocompleteFilter } from './common/SharedAutocomplete';
const SalesOrderList = () => {
    const history = useHistory();
    const { masterData, loading, snackbar, setSnackbar, fetchMasterData, deleteSalesOrder } = useSalesOrders();
    const columns = useTableColumns(masterData);

    const handleEdit = (row) => history.push(`/sales-order/edit/${row.IDNumber}`);
    const handleAddNew = () => history.push('/sales-order/new');

    const toolbarActions = [
        {
            key: 'refresh',
            label: 'Refresh',
            variant: 'outlined',
            size: 'small',
            startIcon: <RefreshIcon />,
            onClick: fetchMasterData
        },
        {
            key: 'add',
            label: 'Add New',
            variant: 'contained',
            size: 'small',
            startIcon: <AddIcon />,
            onClick: handleAddNew
        }
    ];

    const rowActions = [
        {
            key: 'edit',
            tooltip: 'Edit',
            color: 'primary',
            icon: <EditIcon fontSize="small" />,
            onClick: handleEdit
        },
        {
            key: 'delete',
            tooltip: 'Delete',
            color: 'error',
            icon: <DeleteIcon fontSize="small" />,
            requiresConfirm: true,
            confirmTitle: 'Confirm Delete',
            confirmButtonLabel: 'Delete',
            getConfirmMessage: (record) => (
                <>
                    Are you sure you want to delete Sales Order <strong>{record?.SONo}</strong>?
                </>
            ),
            onClick: (record) => deleteSalesOrder(record.IDNumber)
        }
    ];

    return (
        <MasterListMUI
            title="Sales Order Master"
            subtitle="Manage your sales orders with expandable details"
            columns={columns}
            data={masterData}
            loading={loading}
            toolbarActions={toolbarActions}
            rowActions={rowActions}
            renderDetailPanel={(row) => <SalesOrderGridMUI soId={row.IDNumber} readOnly />}
            snackbar={snackbar}
            onCloseSnackbar={() => setSnackbar(prev => ({ ...prev, open: false }))}
        />
    );
};

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
                <Select value={rangeType} onChange={(e) => handleRangeChange(e.target.value)} displayEmpty>
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



const COLUMN_CONFIG = {
    IDNumber: { size: 100, isNumberRange: true },
    SONo: { size: 150, isNumberRange: true },
    SODate: { size: 150, isDate: true },
    SOType: { size: 150 },
    CustomerName: { size: 150 }
};

const formatCellValue = (val, isDateField) => {
    if (val == null || val === '') return '';

    if (isDateField) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) return date.toLocaleDateString();
    }

    return String(val);
};

const useSalesOrders = () => {
    const [masterData, setMasterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}?op=SAL_SalesOrderMaster_List`);
            const data = await response.json();
            setMasterData(data || []);
        } catch (error) {
            showSnackbar('Error fetching sales orders: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteSalesOrder = async (idNumber) => {
        try {
            const response = await fetch(
                `${API_BASE}?op=SAL_SalesOrderMaster_Delete&IDNumber=${idNumber}`
            );
            const result = await response.json();

            if (result?.[0]?.ErrCode === '1' || result?.status === 'success') {
                showSnackbar('Sales order deleted successfully', 'success');
                await fetchMasterData();
                return true;
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error deleting sales order', 'error');
                return false;
            }
        } catch (error) {
            showSnackbar('Error deleting sales order: ' + error.message, 'error');
            return false;
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    return {
        masterData,
        loading,
        snackbar,
        setSnackbar,
        fetchMasterData,
        deleteSalesOrder
    };
};

const useTableColumns = (data) => {
    return useMemo(() => {
        if (!data?.length) return [];

        return Object.entries(COLUMN_CONFIG).map(([key, config]) => {
            const { size, isDate, isNumberRange } = config;

            const uniqueValues = !isDate && !isNumberRange
                ? [...new Set(
                    data.map(row => formatCellValue(row[key], false)).filter(Boolean)
                )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                : [];

            const columnConfig = {
                accessorKey: key,
                header: key,
                size,
                sortingFn: dynamicSort,
                Cell: ({ cell }) => {
                    const value = cell.getValue();
                    if (value == null || value === '') return '';

                    if (isDate) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) return date.toLocaleDateString();
                    }

                    if (isNumberRange) {
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
                }
            };

            if (isDate) {
                columnConfig.Filter = ({ column }) => <DateRangeFilter column={column} />;
                columnConfig.filterFn = dateRangeFilterFn;
            } else if (isNumberRange) {
                columnConfig.Filter = ({ column }) => <NumberRangeFilter column={column} />;
                columnConfig.filterFn = numberRangeFilterFn;
            } else {
                const shouldUseAutocomplete = uniqueValues.length <= 100;
                if (shouldUseAutocomplete) {
                    columnConfig.Filter = ({ column }) => (
                        <MultiAutocompleteFilter column={column} options={uniqueValues} label={key} />
                    );
                    columnConfig.filterFn = multiSelectFilterFn;
                } else {
                    columnConfig.filterVariant = 'text';
                    columnConfig.filterFn = 'includesString';
                }
            }

            return columnConfig;
        });
    }, [data]);
};

export default SalesOrderList;