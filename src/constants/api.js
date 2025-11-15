// constants/api.js
export const API_BASE = 'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx';

export const API_ENDPOINTS = {
    MAIN_GROUPS: `${API_BASE}?op=Gen_Fetch_ItemMainGroup`,
    SUB_MAIN_GROUPS: (mainGroupId) => `${API_BASE}?op=Gen_Fetch_ItemSubMainGroup&MainGroupID=${mainGroupId}`,
    ITEMS: (mainGroupId, subMainGroupId) => `${API_BASE}?op=Gen_Fetch_Item&MainGroupID=${mainGroupId}&SubMianGroupID=${subMainGroupId}`,
    UNITS: (itemId) => `${API_BASE}?op=Gen_Fetch_ItemUnit&ItemID=${itemId}`,
    ORDER_DETAILS: (soId) => `${API_BASE}?op=SAL_SalesOrderDetail_Select&SOID=${soId}`,
    SAVE_DETAIL: (json) => `${API_BASE}?OP=SAL_SalesOrderDetail_Save&json=${json}`,
    DELETE_DETAIL: (detailId) => `${API_BASE}?op=SAL_SalesOrderDetail_Delete&SODetailID=${detailId}`
};
