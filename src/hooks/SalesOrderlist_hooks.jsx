// hooks/useSalesOrders.js
import { useState, useEffect, useMemo } from 'react';
import { Chip } from '@mui/material';
import { DateRangeFilter, NumberRangeFilter } from '../components/mui/common/SalesOrderList_common';
import { dateRangeFilterFn, numberRangeFilterFn, dynamicSort } from '../utils/filterUtils';
import { API_BASE } from '../constants/api';

export const useSalesOrders = () => {
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

export const useTableColumns = (data) => {


    return useMemo(() => {


        console.log("heelo hello")
        if (!data?.length) return [];

        return Object.entries(COLUMN_CONFIG).map(([key, config]) => {
            const { size, isDate, isNumberRange } = config;

            // Get unique values for autocomplete
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

            // Add filter configuration
            if (isDate) {
                columnConfig.Filter = ({ column }) => <DateRangeFilter column={column} />;
                columnConfig.filterFn = dateRangeFilterFn;
            } else if (isNumberRange) {
                columnConfig.Filter = ({ column }) => <NumberRangeFilter column={column} />;
                columnConfig.filterFn = numberRangeFilterFn;
            } else {
                columnConfig.filterVariant = uniqueValues.length <= 100 ? 'autocomplete' : 'text';
                columnConfig.filterSelectOptions = uniqueValues.length <= 100 ? uniqueValues : undefined;
                columnConfig.filterFn = 'includesString';
            }

            return columnConfig;
        });
    }, [data]);
};
