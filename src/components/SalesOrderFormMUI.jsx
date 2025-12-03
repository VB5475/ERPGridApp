import React, { useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import FormMUI from './common/FormMUI';
import SalesOrderGridMUI from './SalesOrderGridMUI';
import { useForm } from '../hooks/useForm';
import { SALESORDER_FORM_API_ENDPOINTS } from '../constants/api';
import { form_createSavePayload, mapLoadedData } from '../utils/dataMapper';
import { validateForm as validateSalesOrderForm } from '../utils/validationUtils';

const INITIAL_FORM_STATE = {
    soNumber: 'Auto',
    soDate: new Date().toISOString().split('T')[0],
    division: null,
    soType: null,
    customer: null,
};

const FORM_FIELD_CONFIG = [
    {
        name: 'soNumber',
        label: 'SO Number',
        readOnly: true,
        gridSize: 6
    },
    {
        name: 'soDate',
        label: 'SO Date',
        type: 'date',
        required: true,
        gridSize: 6
    },
];

const AUTOCOMPLETE_CONFIG = [
    {
        name: 'division',
        label: 'Division',
        placeholder: 'Select division',
        required: true,
        optionLabel: 'DivisionName',
        gridSize: 4
    },
    {
        name: 'soType',
        label: 'SO Type',
        placeholder: 'Select SO type',
        required: true,
        optionLabel: 'SOType',
        dependsOn: 'division',
        gridSize: 4
    },
    {
        name: 'customer',
        label: 'Customer',
        placeholder: 'Select customer',
        required: true,
        optionLabel: 'CustCodeName',
        dependsOn: 'division',
        gridSize: 4
    },
];

const useDropdowns = () => {
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

const SalesOrderFormMUI = () => {
    const history = useHistory();
    const { id } = useParams();
    const isEditMode = id && id !== 'new';
    const gridRef = useRef(null);

    const dropdowns = useDropdowns();

    // Initialize divisions on mount
    React.useEffect(() => {
        dropdowns.fetchDivisions();
    }, []);

    const [showSnackbar, setShowSnackbar] = useState(null);

    // Form hook
    const form = useForm({
        id,
        isEditMode,
        initialState: INITIAL_FORM_STATE,
        loadEndpoint: SALESORDER_FORM_API_ENDPOINTS.LOAD_SO,
        saveEndpoint: SALESORDER_FORM_API_ENDPOINTS.SAVE_SO,
        mapLoadedData,
        createSavePayload: form_createSavePayload,
        dropdowns,
        showSnackbar,
        validateForm: validateSalesOrderForm,
        getRecordId: (response) => response?.[0]?.IDNumber || null
    });

    // Handle division change - fetch dependent dropdowns
    const handleDivisionChange = (_event, newValue) => {
        const divisionId = newValue?.DivisionID;

        // Reset dependent fields
        form.setFormData(prev => ({
            ...prev,
            division: newValue,
            soType: null,
            customer: null
        }));

        // Fetch dependent dropdowns
        if (divisionId) {
            dropdowns.fetchSOTypes(divisionId);
            dropdowns.fetchCustomers(divisionId);
        } else {
            dropdowns.fetchSOTypes(null);
            dropdowns.fetchCustomers(null);
        }
    };

    // Get dropdown options for autocomplete fields
    const getDropdownOptions = (fieldName) => {
        const fieldMap = {
            division: dropdowns.divisions,
            soType: dropdowns.soTypes,
            customer: dropdowns.customers
        };
        return fieldMap[fieldName] || [];
    };

    // Get custom field handlers
    const getFieldHandler = (fieldName) => {
        if (fieldName === 'division') {
            return handleDivisionChange;
        }
        return null;
    };

    // Handle save with grid refresh
    const handleSave = async () => {
        const result = await form.handleSave();
        if (result && gridRef.current && (form.recordId || isEditMode)) {
            // Refresh grid if it has a refresh method
            if (typeof gridRef.current.refresh === 'function') {
                gridRef.current.refresh();
            }
        }
    };

    const handleBack = () => history.push('/');

    // Guide items
    const guideItems = [
        'Select a <strong>Division</strong> first to load SO Types and Customers',
        'SO Number is <strong>auto-generated</strong> after saving',
        'All fields are required except SO Number',
        `Click <strong>"${isEditMode ? 'Update Order' : 'Save & Add Item'}"</strong> to proceed`
    ];

    return (
        <FormMUI
            title={isEditMode ? 'Edit Sales Order' : 'Sales Order Entry'}
            subtitle={isEditMode ? 'Update sales order details' : 'Create and manage sales orders efficiently'}
            textFields={FORM_FIELD_CONFIG}
            autocompleteFields={AUTOCOMPLETE_CONFIG}
            formData={form.formData}
            setFormData={form.setFormData}
            dropdowns={dropdowns}
            getDropdownOptions={getDropdownOptions}
            getFieldHandler={getFieldHandler}
            onSave={handleSave}
            onBack={handleBack}
            loading={form.loading}
            initialLoading={form.initialLoading}
            isEditMode={isEditMode}
            onShowSnackbarReady={setShowSnackbar}
            guideItems={guideItems}
            saveButtonText={isEditMode ? 'Update Order' : 'Save & Add Item'}
        >
            {(form.recordId || isEditMode) && (
                <Box sx={{ mt: 3 }}>
                    <SalesOrderGridMUI ref={gridRef} soId={form.recordId || id} />
                </Box>
            )}
        </FormMUI>
    );
};

export default SalesOrderFormMUI;
