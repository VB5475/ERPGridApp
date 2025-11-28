
// utils/filterUtils.js
export const dateRangeFilterFn = (row, columnId, filterValue) => {
    if (!filterValue?.start || !filterValue?.end) return true;

    const cellValue = row.getValue(columnId);
    if (!cellValue) return false;

    const cellDate = new Date(cellValue);
    if (isNaN(cellDate.getTime())) return false;

    const normalize = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return normalize(cellDate) >= normalize(filterValue.start) &&
        normalize(cellDate) <= normalize(filterValue.end);
};

export const numberRangeFilterFn = (row, columnId, filterValue) => {
    if (!filterValue || (filterValue.from === '' && filterValue.to === '')) return true;

    const cellValue = Number(row.getValue(columnId));
    if (isNaN(cellValue)) return false;

    const from = filterValue.from !== '' ? Number(filterValue.from) : -Infinity;
    const to = filterValue.to !== '' ? Number(filterValue.to) : Infinity;

    return cellValue >= from && cellValue <= to;
};

export const multiSelectFilterFn = (row, columnId, filterValue) => {
    if (filterValue == null) return true;

    const cellValue = row.getValue(columnId);
    if (cellValue == null) return false;

    const normalize = (val) => String(val).toLowerCase();
    const normalizedCellValue = normalize(cellValue);

    if (Array.isArray(filterValue)) {
        if (!filterValue.length) return true;
        return filterValue.some((selected) => normalize(selected) === normalizedCellValue);
    }

    const normalizedFilterValue = normalize(filterValue);
    return normalizedCellValue.includes(normalizedFilterValue);
};

export const dynamicSort = (rowA, rowB, columnId) => {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);

    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    // Check if values are dates
    const dateA = new Date(a);
    const dateB = new Date(b);
    const isDate = (val, date) => !isNaN(date.getTime()) && typeof val === 'string' &&
        (val.includes('-') || val.includes('/') || val.includes('T'));

    if (isDate(a, dateA) && isDate(b, dateB)) {
        return dateA.getTime() - dateB.getTime();
    }

    // Check if values are numbers
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
    }

    // String comparison
    return String(a).localeCompare(String(b), undefined, {
        sensitivity: 'base',
        numeric: true
    });
};
