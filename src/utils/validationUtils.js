// utils/validationUtils.js
export const validateRow = (row) => {
    const errors = [];

    if (!row?.ItemID || !row?.UnitID) {
        errors.push('Please fill all required fields');
    }

    if (row.Qty <= 0) {
        errors.push('Quantity must be greater than 0');
    }

    if (row.Rate <= 0) {
        errors.push('Rate must be greater than 0');
    }

    return errors;
};

export const checkDuplicateRow = (orderDetails, mainGroupId, subMainGroupId, itemId, excludeId = null) => {
    return orderDetails.some(row =>
        row.IDNumber !== excludeId &&
        row.MainGroupID === mainGroupId &&
        row.SubMainGroupID === subMainGroupId &&
        row.ItemID === itemId
    );
};

export const calculateAmount = (qty, rate) => (qty || 0) * (rate || 0);

export const calculateTotal = (orderDetails) => {
    return orderDetails.reduce((sum, row) => sum + (row.Amount || 0), 0);
};

export const validateForm = (formData) => {
    const { soDate, division, soType, customer } = formData;

    if (!soDate || !division || !soType || !customer) {
        return 'Please fill in all required fields';
    }

    return null;
};
