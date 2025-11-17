export const INITIAL_FORM_STATE = {
    soNumber: 'Auto',
    soDate: new Date().toISOString().split('T')[0],
    division: null,
    soType: null,
    customer: null,
};

export const FORM_FIELD_CONFIG = [
    {
        name: 'soNumber',
        label: 'SO Number',
        readOnly: true,
        gridSize: { xs: 12, sm: 6 }


    },
    {
        name: 'soDate',
        label: 'SO Date',
        type: 'date',
        required: true,
        gridSize: { xs: 12, sm: 6 }

    },
];

export const AUTOCOMPLETE_CONFIG = [
    {
        name: 'division',
        label: 'Division',
        placeholder: 'Select division',
        required: true,
        optionLabel: 'DivisionName',
        gridSize: { xs: 12, sm: 4 }
    },
    {
        name: 'soType',
        label: 'SO Type',
        placeholder: 'Select SO type',
        required: true,
        optionLabel: 'SOType',
        dependsOn: 'division',
        gridSize: { xs: 12, sm: 4 }
    },
    {
        name: 'customer',
        label: 'Customer',
        placeholder: 'Select customer',
        required: true,
        optionLabel: 'CustCodeName',
        dependsOn: 'division',
        gridSize: { xs: 12, sm: 4 }
    },
];
