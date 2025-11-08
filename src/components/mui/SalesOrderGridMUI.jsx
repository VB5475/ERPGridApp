import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Chip,
    Snackbar,
    Alert,
    Tooltip,
    Zoom,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Save as SaveIcon,
} from '@mui/icons-material';

const SalesOrderGridMUI = forwardRef(({ soId, readOnly = false }, ref) => {
    const [orderDetails, setOrderDetails] = useState([]);
    const [mainGroups, setMainGroups] = useState([]);
    const [subMainGroups, setSubMainGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [newRow, setNewRow] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [savingRowId, setSavingRowId] = useState(null);

    const addButtonRef = useRef(null);
    const mainGroupInputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focusAddButton: () => {
            setTimeout(() => {
                addButtonRef.current?.focus();
                addButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }));

    useEffect(() => {
        fetchMainGroups();
        fetchOrderDetails();
    }, [soId]);

    useEffect(() => {
        if (editingRowId !== null && mainGroupInputRef.current) {
            setTimeout(() => {
                mainGroupInputRef.current?.focus();
            }, 100);
        }
    }, [editingRowId]);

    const fetchMainGroups = async () => {
        try {
            const response = await fetch(
                'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemMainGroup'
            );
            const data = await response.json();
            setMainGroups(data || []);
        } catch (error) {
            showSnackbar('Error fetching main groups: ' + error.message, 'error');
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderDetail_Select&SOID=${soId}`
            );
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                const mappedData = data.map((item) => ({
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
                }));
                setOrderDetails(mappedData);
            } else {
                setOrderDetails([]);
            }
        } catch (error) {
            showSnackbar('Error fetching order details: ' + error.message, 'error');
            setOrderDetails([]);
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchSubMainGroups = async (mainGroupId) => {
        if (!mainGroupId) return;
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemSubMainGroup&MainGroupID=${mainGroupId}`
            );
            const data = await response.json();
            setSubMainGroups(data || []);
        } catch (error) {
            showSnackbar('Error fetching sub main groups: ' + error.message, 'error');
        }
    };

    const fetchItems = async (mainGroupId, subMainGroupId) => {
        if (!mainGroupId || !subMainGroupId) return;
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_Item&MainGroupID=${mainGroupId}&SubMianGroupID=${subMainGroupId}`
            );
            const data = await response.json();
            setItems(data || []);
        } catch (error) {
            showSnackbar('Error fetching items: ' + error.message, 'error');
        }
    };

    const fetchUnits = async (itemId) => {
        if (!itemId) return;
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=Gen_Fetch_ItemUnit&ItemID=${itemId}`
            );
            const data = await response.json();
            setUnits(data || []);
        } catch (error) {
            showSnackbar('Error fetching units: ' + error.message, 'error');
        }
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const checkDuplicateRow = (mainGroupId, subMainGroupId, itemId, excludeId = null) => {
        return orderDetails.some(row =>
            row.IDNumber !== excludeId &&
            row.MainGroupID === mainGroupId &&
            row.SubMainGroupID === subMainGroupId &&
            row.ItemID === itemId
        );
    };

    const handleAddNew = () => {
        setNewRow({
            MainGroupID: null,
            SubMainGroupID: null,
            ItemID: null,
            UnitID: null,
            Qty: 0,
            Rate: 0,
            Amount: 0,
        });
    };

    const handleEdit = async (row) => {
        setEditingRowId(row.IDNumber);
        setEditingRow({ ...row });
        if (row.MainGroupID) {
            await fetchSubMainGroups(row.MainGroupID);
            if (row.SubMainGroupID) {
                await fetchItems(row.MainGroupID, row.SubMainGroupID);
            }
        }
        if (row.ItemID) {
            await fetchUnits(row.ItemID);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingRow?.ItemID || !editingRow?.UnitID) {
            showSnackbar('Please fill all required fields', 'error');
            return;
        }

        if (editingRow.Qty <= 0) {
            showSnackbar('Quantity must be greater than 0', 'error');
            return;
        }

        if (editingRow.Rate <= 0) {
            showSnackbar('Rate must be greater than 0', 'error');
            return;
        }

        if (checkDuplicateRow(editingRow.MainGroupID, editingRow.SubMainGroupID, editingRow.ItemID, editingRowId)) {
            showSnackbar('Duplicate row detected. A row with the same Main Group, Sub Main Group, and Item already exists.', 'error');
            return;
        }

        try {
            setSavingRowId(editingRowId);

            const saveData = [{
                IDNumber: editingRow.IDNumber,
                SOID: soId,
                ItemID: editingRow.ItemID,
                UnitID: editingRow.UnitID,
                Qty: editingRow.Qty,
                Rate: editingRow.Rate,
                Amount: editingRow.Amount,
            }];

            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?OP=SAL_SalesOrderDetail_Save&json=${JSON.stringify(saveData)}`
            );
            const result = await response.json();

            if (result?.[0]?.ErrCode === "1") {
                showSnackbar('Record saved successfully!', 'success');
                await fetchOrderDetails();
                setEditingRowId(null);
                setEditingRow(null);

                setTimeout(() => {
                    addButtonRef.current?.focus();
                }, 100);
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error saving record', 'error');
            }
        } catch (error) {
            showSnackbar('Error saving record: ' + error.message, 'error');
        } finally {
            setSavingRowId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditingRow(null);
        setTimeout(() => {
            addButtonRef.current?.focus();
        }, 100);
    };

    const handleSaveNew = async () => {
        if (!newRow?.ItemID || !newRow?.UnitID) {
            showSnackbar('Please fill all required fields', 'error');
            return;
        }

        if (newRow.Qty <= 0) {
            showSnackbar('Quantity must be greater than 0', 'error');
            return;
        }

        if (newRow.Rate <= 0) {
            showSnackbar('Rate must be greater than 0', 'error');
            return;
        }

        if (checkDuplicateRow(newRow.MainGroupID, newRow.SubMainGroupID, newRow.ItemID)) {
            showSnackbar('Duplicate row detected. A row with the same Main Group, Sub Main Group, and Item already exists.', 'error');
            return;
        }

        try {
            setSavingRowId('new');

            const saveData = [{
                IDNumber: 0,
                SOID: soId,
                ItemID: newRow.ItemID,
                UnitID: newRow.UnitID,
                Qty: newRow.Qty,
                Rate: newRow.Rate,
                Amount: newRow.Amount,
            }];

            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?OP=SAL_SalesOrderDetail_Save&json=${JSON.stringify(saveData)}`
            );
            const result = await response.json();

            if (result?.[0]?.ErrCode === "1") {
                showSnackbar('Item added successfully!', 'success');
                await fetchOrderDetails();
                setNewRow(null);

                setTimeout(() => {
                    addButtonRef.current?.focus();
                }, 100);
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error adding item', 'error');
            }
        } catch (error) {
            showSnackbar('Error adding item: ' + error.message, 'error');
        } finally {
            setSavingRowId(null);
        }
    };

    const handleCancelNew = () => {
        setNewRow(null);
        setTimeout(() => {
            addButtonRef.current?.focus();
        }, 100);
    };

    const handleDelete = async (row) => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderDetail_Delete&SODetailID=${row.IDNumber}`
            );
            await response.json();

            showSnackbar('Item deleted successfully!', 'success');
            await fetchOrderDetails();
            setDeleteDialog({ open: false, row: null });
        } catch (error) {
            showSnackbar('Error deleting item: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateAmount = (qty, rate) => (qty || 0) * (rate || 0);

    const calculateTotal = () => {
        return orderDetails.reduce((sum, row) => sum + (row.Amount || 0), 0);
    };

    if (initialLoading) {
        return (
            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    mt: 2.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 200
                }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
                        Loading order details...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                mt: 2.5,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                    }}
                >
                    Order Details (SO ID: {soId})
                </Typography>
                {!readOnly && (
                    <Button
                        ref={addButtonRef}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNew}
                        disabled={newRow !== null || editingRowId !== null || loading || savingRowId !== null}
                        size="small"
                        sx={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 0.75,
                            fontSize: '0.875rem',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            },
                            '&:focus': {
                                outline: '3px solid rgba(59, 130, 246, 0.5)',
                                outlineOffset: '2px',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Add Item
                    </Button>
                )}
            </Box>

            <TableContainer sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Main Group
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Sub Main Group
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Item
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Unit
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Qty
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Rate
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                Amount
                            </TableCell>
                            {!readOnly && (
                                <TableCell align="center" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem', py: 1.25 }}>
                                    Actions
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newRow && (
                            <TableRow sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-root': { py: 1.25 } }}>
                                <TableCell>
                                    <Autocomplete
                                        options={mainGroups}
                                        value={mainGroups.find(g => g.MainGroupID === newRow.MainGroupID) || null}
                                        onChange={(_event, newValue) => {
                                            setNewRow((prev) => prev ? ({
                                                ...prev,
                                                MainGroupID: newValue?.MainGroupID || null,
                                                SubMainGroupID: null,
                                                ItemID: null,
                                                UnitID: null
                                            }) : null);
                                            if (newValue) fetchSubMainGroups(newValue.MainGroupID);
                                        }}
                                        getOptionLabel={(option) => option.MainGroup}
                                        size="small"
                                        sx={{ width: 160 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select"
                                                autoFocus
                                                sx={{
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                }}
                                            />
                                        )}
                                        slotProps={{
                                            popper: {
                                                sx: { width: 'auto!important', minWidth: '200px' },
                                            },
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Autocomplete
                                        options={subMainGroups}
                                        value={subMainGroups.find(g => g.SubMainGroupID === newRow.SubMainGroupID) || null}
                                        onChange={(_event, newValue) => {
                                            setNewRow((prev) => prev ? ({
                                                ...prev,
                                                SubMainGroupID: newValue?.SubMainGroupID || null,
                                                ItemID: null,
                                                UnitID: null
                                            }) : null);
                                            if (newValue && newRow.MainGroupID) {
                                                fetchItems(newRow.MainGroupID, newValue.SubMainGroupID);
                                            }
                                        }}
                                        getOptionLabel={(option) => option.SubMianGroup}
                                        disabled={!newRow.MainGroupID}
                                        size="small"
                                        sx={{ width: 160 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select"
                                                sx={{
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                }}
                                            />
                                        )}
                                        slotProps={{
                                            popper: {
                                                sx: { width: 'auto!important', minWidth: '200px' },
                                            },
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Autocomplete
                                        options={items}
                                        value={items.find(i => i.ItemID === newRow.ItemID) || null}
                                        onChange={(_event, newValue) => {
                                            setNewRow((prev) => prev ? ({
                                                ...prev,
                                                ItemID: newValue?.ItemID || null,
                                                UnitID: null
                                            }) : null);
                                            if (newValue) fetchUnits(newValue.ItemID);
                                        }}
                                        getOptionLabel={(option) => option.ItemName}
                                        disabled={!newRow.SubMainGroupID}
                                        size="small"
                                        sx={{ width: 140 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select"
                                                sx={{
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                }}
                                            />
                                        )}
                                        slotProps={{
                                            popper: {
                                                sx: { width: 'auto!important', minWidth: '200px' },
                                            },
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Autocomplete
                                        options={units}
                                        value={units.find(u => u.UnitID === newRow.UnitID) || null}
                                        onChange={(_event, newValue) =>
                                            setNewRow((prev) => prev ? ({ ...prev, UnitID: newValue?.UnitID || null }) : null)
                                        }
                                        getOptionLabel={(option) => option.Unit}
                                        disabled={!newRow.ItemID}
                                        size="small"
                                        sx={{ width: 100 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select"
                                                sx={{
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                }}
                                            />
                                        )}
                                        slotProps={{
                                            popper: {
                                                sx: { width: 'auto!important', minWidth: '150px' },
                                            },
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={newRow.Qty}
                                        onChange={(e) => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            setNewRow((prev) => prev ? ({
                                                ...prev,
                                                Qty: qty,
                                                Amount: calculateAmount(qty, prev.Rate)
                                            }) : null);
                                        }}
                                        inputProps={{ min: 0, step: 0.001 }}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 1,
                                            width: 80,
                                            '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={newRow.Rate}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value) || 0;
                                            setNewRow((prev) => prev ? ({
                                                ...prev,
                                                Rate: rate,
                                                Amount: calculateAmount(prev.Qty, rate)
                                            }) : null);
                                        }}
                                        inputProps={{ min: 0, step: 0.01 }}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 1,
                                            width: 90,
                                            '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={newRow.Amount.toFixed(2)}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26, width: 80 }}
                                    />
                                </TableCell>
                                {!readOnly && (
                                    <TableCell align="center" sx={{ width: 100 }}>
                                        <Tooltip title="Save" TransitionComponent={Zoom}>
                                            <IconButton
                                                color="success"
                                                size="small"
                                                onClick={handleSaveNew}
                                                disabled={savingRowId === 'new'}
                                                sx={{ p: 0.5 }}
                                            >
                                                {savingRowId === 'new' ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    <CheckIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Cancel" TransitionComponent={Zoom}>
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={handleCancelNew}
                                                disabled={savingRowId === 'new'}
                                                sx={{ p: 0.5, ml: 0.5 }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                        {orderDetails.length === 0 && !newRow && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary" variant="body2">
                                        No items added yet. Click "Add Item" to begin.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {orderDetails.map((row) => (
                            editingRowId === row.IDNumber ? (
                                <TableRow key={row.IDNumber} sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-root': { py: 1.25 } }}>
                                    <TableCell>
                                        <Autocomplete
                                            options={mainGroups}
                                            value={mainGroups.find(g => g.MainGroupID === editingRow.MainGroupID) || null}
                                            onChange={(_event, newValue) => {
                                                setEditingRow((prev) => ({
                                                    ...prev,
                                                    MainGroupID: newValue?.MainGroupID || null,
                                                    SubMainGroupID: null,
                                                    ItemID: null,
                                                    UnitID: null
                                                }));
                                                if (newValue) fetchSubMainGroups(newValue.MainGroupID);
                                            }}
                                            getOptionLabel={(option) => option.MainGroup}
                                            size="small"
                                            sx={{ width: 160 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={mainGroupInputRef}
                                                    placeholder="Select"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                    }}
                                                />
                                            )}
                                            slotProps={{
                                                popper: {
                                                    sx: { width: 'auto!important', minWidth: '200px' },
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Autocomplete
                                            options={subMainGroups}
                                            value={subMainGroups.find(g => g.SubMainGroupID === editingRow.SubMainGroupID) || null}
                                            onChange={(_event, newValue) => {
                                                setEditingRow((prev) => ({
                                                    ...prev,
                                                    SubMainGroupID: newValue?.SubMainGroupID || null,
                                                    ItemID: null,
                                                    UnitID: null
                                                }));
                                                if (newValue && editingRow.MainGroupID) {
                                                    fetchItems(editingRow.MainGroupID, newValue.SubMainGroupID);
                                                }
                                            }}
                                            getOptionLabel={(option) => option.SubMianGroup}
                                            disabled={!editingRow.MainGroupID}
                                            size="small"
                                            sx={{ width: 160 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                    }}
                                                />
                                            )}
                                            slotProps={{
                                                popper: {
                                                    sx: { width: 'auto!important', minWidth: '200px' },
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Autocomplete
                                            options={items}
                                            value={items.find(i => i.ItemID === editingRow.ItemID) || null}
                                            onChange={(_event, newValue) => {
                                                setEditingRow((prev) => ({
                                                    ...prev,
                                                    ItemID: newValue?.ItemID || null,
                                                    UnitID: null
                                                }));
                                                if (newValue) fetchUnits(newValue.ItemID);
                                            }}
                                            getOptionLabel={(option) => option.ItemName}
                                            disabled={!editingRow.SubMainGroupID}
                                            size="small"
                                            sx={{ width: 140 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                    }}
                                                />
                                            )}
                                            slotProps={{
                                                popper: {
                                                    sx: { width: 'auto!important', minWidth: '200px' },
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Autocomplete
                                            options={units}
                                            value={units.find(u => u.UnitID === editingRow.UnitID) || null}
                                            onChange={(_event, newValue) =>
                                                setEditingRow((prev) => ({ ...prev, UnitID: newValue?.UnitID || null }))
                                            }
                                            getOptionLabel={(option) => option.Unit}
                                            disabled={!editingRow.ItemID}
                                            size="small"
                                            sx={{ width: 100 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select"
                                                    sx={{
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 }
                                                    }}
                                                />
                                            )}
                                            slotProps={{
                                                popper: {
                                                    sx: { width: 'auto!important', minWidth: '150px' },
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={editingRow.Qty}
                                            onChange={(e) => {
                                                const qty = parseFloat(e.target.value) || 0;
                                                setEditingRow((prev) => ({
                                                    ...prev,
                                                    Qty: qty,
                                                    Amount: calculateAmount(qty, prev.Rate)
                                                }));
                                            }}
                                            inputProps={{ min: 0, step: 0.001 }}
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1,
                                                width: 80,
                                                '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={editingRow.Rate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value) || 0;
                                                setEditingRow((prev) => ({
                                                    ...prev,
                                                    Rate: rate,
                                                    Amount: calculateAmount(prev.Qty, rate)
                                                }));
                                            }}
                                            inputProps={{ min: 0, step: 0.01 }}
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1,
                                                width: 90,
                                                '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75, textAlign: 'center' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={editingRow.Amount.toFixed(2)}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26, width: 100 }}
                                        />
                                    </TableCell>
                                    {!readOnly && (
                                        <TableCell align="center" sx={{ width: 100 }}>
                                            <Tooltip title="Save" TransitionComponent={Zoom}>
                                                <IconButton
                                                    color="success"
                                                    size="small"
                                                    onClick={handleSaveEdit}
                                                    disabled={savingRowId === editingRowId}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    {savingRowId === editingRowId ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <CheckIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Cancel" TransitionComponent={Zoom}>
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={handleCancelEdit}
                                                    disabled={savingRowId === editingRowId}
                                                    sx={{ p: 0.5, ml: 0.5 }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ) : (
                                <TableRow
                                    key={row.IDNumber}
                                    hover
                                    sx={{
                                        '&:hover': { bgcolor: '#f8fafc' },
                                        transition: 'background-color 0.15s ease',
                                    }}
                                >
                                    <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.MainGroup}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.SubMainGroup}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.ItemName}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>{row.Unit}</TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                                            {row.Qty}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                                            {row.Rate.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`₹ ${row.Amount.toFixed(2)}`}
                                            color="success"
                                            size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                        />
                                    </TableCell>
                                    {!readOnly && (
                                        <TableCell align="center" sx={{ width: 100 }}>
                                            <Tooltip title="Edit" TransitionComponent={Zoom}>
                                                <IconButton
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => handleEdit(row)}
                                                    disabled={newRow !== null || editingRowId !== null || loading || savingRowId !== null}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    <EditIcon sx={{ fontSize: '1.125rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete" TransitionComponent={Zoom}>
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setDeleteDialog({ open: true, row })}
                                                    disabled={newRow !== null || editingRowId !== null || loading || savingRowId !== null}
                                                    sx={{ p: 0.5, ml: 0.5 }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: '1.125rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        ))}

                        {orderDetails.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f1f5f9', '& .MuiTableCell-root': { borderTop: '2px solid #cbd5e1' } }}>
                                <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', py: 1.5 }}>
                                    Total:
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Chip
                                        label={`₹ ${calculateTotal().toFixed(2)}`}
                                        color="primary"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            height: 32,
                                            minWidth: 120,
                                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                        }}
                                    />
                                </TableCell>
                                {!readOnly && <TableCell />}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, row: null })}
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.875rem' }}>
                        Are you sure you want to delete this record? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, row: null })}
                        disabled={loading}
                        sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDelete(deleteDialog.row)}
                        color="error"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{ borderRadius: 2, fontSize: '0.875rem' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
});

SalesOrderGridMUI.displayName = 'SalesOrderGridMUI';

export default SalesOrderGridMUI;
