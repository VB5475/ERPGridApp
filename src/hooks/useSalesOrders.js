// hooks/useSalesOrders.js
import { useState, useEffect } from 'react';

const API_BASE = 'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx';

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
