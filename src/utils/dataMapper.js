// utils/dataMapper.js
import { formatDateForAPI, formatDateForInput } from "./dateUtils"
export const mapOrderDetail = (item) => ({
    IDNumber: item.SODetID,
    MainGroupID: item.MainGroupID,
    MainGroup: item.MainGroup,
    SubMainGroupID: item.SubMainGroupID,
    SubMainGroup: item.SubMianGroup,
    ItemID: item.ItemID,
    ItemName: item.ItemName,
    UnitID: item.UnitID,
    Unit: item.Unit,
    Qty: item.Qty,
    Rate: item.Rate,
    Amount: item.Amount
});

export const createSavePayload = (row, soId) => [{
    IDNumber: row.IDNumber || 0,
    SOID: soId,
    ItemID: row.ItemID,
    UnitID: row.UnitID,
    Qty: row.Qty,
    Rate: row.Rate,
    Amount: row.Amount,
}];

export const mapLoadedData = (soData) => ({
    soNumber: soData.SONo || 'Auto',
    soDate: soData.SODate ? formatDateForInput(soData.SODate) : new Date().toISOString().split('T')[0],
    division: { DivisionID: soData.DivisionID, DivisionName: soData.Division },
    soType: { SOTypeID: soData.SOTypeID, SOType: soData.SOType },
    customer: { CustomerId: soData.CustomerID, CustCodeName: soData.CustomerName },
});

export const form_createSavePayload = (formData, isEditMode, id) => [{
    IDNumber: isEditMode ? Number(id) : 0,
    SONo: isEditMode ? formData.soNumber : "",
    SODate: formatDateForAPI(formData.soDate),
    SOTypeID: formData.soType.SOTypeID,
    CustomerID: formData.customer.CustomerId,
    YearID: 1,
    DivisionID: formData.division.DivisionID,
    LoginID: 1
}];
