// utils/dataMapper.js
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
