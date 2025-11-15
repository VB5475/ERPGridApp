// hooks/useTableColumns.js
import { useMemo } from 'react';
import { Chip } from '@mui/material';
import DateRangeFilter from '../components/mui/common/DateRangeFilter';
import NumberRangeFilter from '../components/mui/common/NumberRangeFilter';
import { dateRangeFilterFn, numberRangeFilterFn, dynamicSort } from '../utils/filterUtils';

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