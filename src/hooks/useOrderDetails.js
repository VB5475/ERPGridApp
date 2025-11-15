// hooks/useOrderDetails.js
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { mapOrderDetail } from '../utils/dataMapper';

export const useOrderDetails = (soId) => {
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.ORDER_DETAILS(soId));
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                setOrderDetails(data.map(mapOrderDetail));
            } else {
                setOrderDetails([]);
            }
            setError(null);
        } catch (err) {
            setError('Error fetching order details: ' + err.message);
            setOrderDetails([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (soId) fetchOrderDetails();
    }, [soId]);

    return { orderDetails, loading, error, refetch: fetchOrderDetails };
};
