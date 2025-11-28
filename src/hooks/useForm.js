import { useState, useEffect } from 'react';

/**
 * Generic Form Hook
 * 
 * @param {Object} config - Form configuration
 * @param {string} config.id - Record ID (from route params)
 * @param {boolean} config.isEditMode - Whether in edit mode
 * @param {Object} config.initialState - Initial form state
 * @param {Function} config.loadEndpoint - Function to get load endpoint URL
 * @param {Function} config.saveEndpoint - Function to get save endpoint URL
 * @param {Function} config.mapLoadedData - Function to map loaded data to form state
 * @param {Function} config.createSavePayload - Function to create save payload
 * @param {Object} config.dropdowns - Dropdowns object
 * @param {Function} config.showSnackbar - Function to show snackbar
 * @param {Function} config.validateForm - Function to validate form data
 * @param {Function} config.onSaveSuccess - Callback after successful save
 * @param {Function} config.getRecordId - Function to extract record ID from save response
 * @returns {Object} Form state and handlers
 */
export const useForm = ({
    id,
    isEditMode,
    initialState,
    loadEndpoint,
    saveEndpoint,
    mapLoadedData: mapData,
    createSavePayload: createPayload,
    dropdowns = {},
    showSnackbar,
    validateForm: validate,
    onSaveSuccess,
    getRecordId = (response) => response?.[0]?.IDNumber || null
}) => {
    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [recordId, setRecordId] = useState(null);

    // Load data in edit mode
    useEffect(() => {
        if (isEditMode && id && loadEndpoint) {
            const loadData = async () => {
                try {
                    setInitialLoading(true);
                    const response = await fetch(loadEndpoint(id));
                    const data = await response.json();

                    if (data && data.length > 0) {
                        const mappedData = mapData ? mapData(data[0]) : data[0];
                        setFormData(mappedData);
                        setRecordId(id);
                    } else {
                        showSnackbar?.('Record not found', 'error');
                    }
                } catch (error) {
                    showSnackbar?.('Error loading data: ' + error.message, 'error');
                } finally {
                    setInitialLoading(false);
                }
            };
            loadData();
        } else {
            setInitialLoading(false);
        }
    }, [id, isEditMode, loadEndpoint, mapData, showSnackbar]);

    const handleSave = async (additionalData = {}) => {
        if (validate) {
            const validationError = validate(formData);
            if (validationError) {
                showSnackbar?.(validationError, 'error');
                return false;
            }
        }

        try {
            // setLoading(true);
            const payload = createPayload ? createPayload(formData, isEditMode, id) : formData;
            const jsonPayload = JSON.stringify(payload);
            const url = saveEndpoint(jsonPayload);

            const response = await fetch(url);
            const result = await response.json();

            if (result?.[0]?.ErrCode === '1' || result?.status === 'success') {
                const newRecordId = getRecordId(result);
                if (newRecordId) {
                    setRecordId(newRecordId);
                }

                showSnackbar?.(
                    isEditMode ? 'Record updated successfully' : 'Record saved successfully',
                    'success'
                );

                if (onSaveSuccess) {
                    onSaveSuccess(result, newRecordId || id);
                }
                return true;
            } else {
                showSnackbar?.(result?.[0]?.ErrMsg || 'Error saving record', 'error');
                return false;
            }
        } catch (error) {
            showSnackbar?.('Error saving record: ' + error.message, 'error');
            return false;
        } finally {
            // setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        loading,
        initialLoading,
        recordId,
        handleSave
    };
};

