// hooks/useDropdownData.js
import { useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';

export const useDropdownData = () => {
    const [mainGroups, setMainGroups] = useState([]);
    const [subMainGroups, setSubMainGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);

    const fetchData = async (url, setter, errorMsg) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            setter(data || []);
        } catch (error) {
            throw new Error(errorMsg + error.message);
        }
    };

    const fetchMainGroups = () =>
        fetchData(API_ENDPOINTS.MAIN_GROUPS, setMainGroups, 'Error fetching main groups: ');

    const fetchSubMainGroups = (mainGroupId) => {
        if (!mainGroupId) return;
        return fetchData(API_ENDPOINTS.SUB_MAIN_GROUPS(mainGroupId), setSubMainGroups, 'Error fetching sub main groups: ');
    };

    const fetchItems = (mainGroupId, subMainGroupId) => {
        if (!mainGroupId || !subMainGroupId) return;
        return fetchData(API_ENDPOINTS.ITEMS(mainGroupId, subMainGroupId), setItems, 'Error fetching items: ');
    };

    const fetchUnits = (itemId) => {
        if (!itemId) return;
        return fetchData(API_ENDPOINTS.UNITS(itemId), setUnits, 'Error fetching units: ');
    };

    return {
        mainGroups,
        subMainGroups,
        items,
        units,
        fetchMainGroups,
        fetchSubMainGroups,
        fetchItems,
        fetchUnits
    };
};
