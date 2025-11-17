import { useState, useEffect } from 'react';
import { SALESORDER_FORM_API_ENDPOINTS } from '../constants/api';
import { INITIAL_FORM_STATE } from '../constants/formConfig';
import { mapLoadedData, form_createSavePayload } from '../utils/dataMapper';
import { validateForm } from '../utils/validationUtils';

export const useDropdowns = () => {
    const [divisions, setDivisions] = useState([]);
    const [soTypes, setSOTypes] = useState([]);
    const [customers, setCustomers] = useState([]);

    const fetchData = async (url, setter, errorMsg) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            setter(data || []);
        } catch (error) {
            throw new Error(errorMsg + error.message);
        }
    };

    const fetchDivisions = () =>
        fetchData(SALESORDER_FORM_API_ENDPOINTS.DIVISIONS, setDivisions, 'Error fetching divisions: ');

    const fetchSOTypes = (divisionId) => {
        if (!divisionId) {
            setSOTypes([]);
            return;
        }
        return fetchData(SALESORDER_FORM_API_ENDPOINTS.SO_TYPES(divisionId), setSOTypes, 'Error fetching SO types: ');
    };

    const fetchCustomers = (divisionId) => {
        if (!divisionId) {
            setCustomers([]);
            return;
        }
        return fetchData(SALESORDER_FORM_API_ENDPOINTS.CUSTOMERS(divisionId), setCustomers, 'Error fetching customers: ');
    };

    return {
        divisions,
        soTypes,
        customers,
        fetchDivisions,
        fetchSOTypes,
        fetchCustomers
    };
};


export const useSalesOrderForm = (id, isEditMode, dropdowns, showSnackbar) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [soId, setSoId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadSalesOrder(Number(id));
        }
    }, [id, isEditMode]);

    const loadSalesOrder = async (soIdNumber) => {
        try {
            setInitialLoading(true);
            const response = await fetch(SALESORDER_FORM_API_ENDPOINTS.LOAD_SO(soIdNumber));
            const data = await response.json();

            if (data && data.length > 0) {
                const soData = data[0];
                setSoId(soIdNumber);
                setFormData(mapLoadedData(soData));

                if (soData.DivisionID) {
                    await dropdowns.fetchSOTypes(soData.DivisionID);
                    await dropdowns.fetchCustomers(soData.DivisionID);
                }
            }
        } catch (error) {
            showSnackbar('Error loading sales order: ' + error.message, 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async (gridRef) => {
        const error = validateForm(formData);
        if (error) {
            showSnackbar(error, 'error');
            return;
        }

        try {
            setLoading(true);
            const payload = form_createSavePayload(formData, isEditMode, id);
            const response = await fetch(SALESORDER_FORM_API_ENDPOINTS.SAVE_SO(JSON.stringify(payload)));
            const data = await response.json();

            if (data && data.length > 0 && data[0].ErrCode === "1") {
                setFormData(prev => ({ ...prev, soNumber: data[0].SONO }));
                showSnackbar(
                    `Sales Order #${data[0].SONO} ${isEditMode ? 'updated' : 'saved'} successfully!`,
                    'success'
                );

                if (!isEditMode) {
                    setSoId(data[0]?.IDNumber);
                    setTimeout(() => gridRef.current?.focusAddButton(), 300);
                }
            } else {
                showSnackbar(data?.[0]?.ErrMsg || 'Error saving sales order', 'error');
            }
        } catch (error) {
            showSnackbar('Error saving sales order: ' + error.message, 'error');
            console.log(error)
        } finally {
            setLoading(false);
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
            dropdowns.fetchSOTypes(newValue.DivisionID);
            dropdowns.fetchCustomers(newValue.DivisionID);
        }
    };

    return {
        formData,
        setFormData,
        soId,
        loading,
        initialLoading,
        handleSave,
        handleDivisionChange
    };
};
