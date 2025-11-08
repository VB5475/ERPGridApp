import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Chip,
    Tooltip,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Collapse,
} from '@mui/material';
import {
    Add as AddIcon,
    KeyboardArrowDown as ExpandIcon,
    KeyboardArrowUp as CollapseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import SalesOrderGridMUI from './SalesOrderGridMUI';

const SalesOrderList = () => {
    const [masterData, setMasterData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState('newest');

    const history = useHistory();
    const tableRef = useRef(null);

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        sortAndFilterData();
    }, [masterData, sortOrder]);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_List'
            );
            const data = await response.json();
            setMasterData(data || []);
        } catch (error) {
            showSnackbar('Error fetching sales orders: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const sortAndFilterData = () => {
        const sorted = [...masterData].sort((a, b) => {
            const dateA = new Date(a.SODate || 0);
            const dateB = new Date(b.SODate || 0);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        setFilteredData(sorted);
        setPage(0);
    };

    const toggleChildGrid = (rowId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(rowId)) newExpanded.delete(rowId);
        else newExpanded.add(rowId);
        setExpandedRows(newExpanded);
    };

    const handleEdit = (row) => {
        history.push(`/sales-order/edit/${row.IDNumber}`); // Changed from /sales-order-form/
    };

    const handleAddNew = () => {
        history.push('/sales-order/new'); // Changed from /sales-order-form/new
    };

    const handleDelete = async () => {
        if (!deleteDialog.record) return;
        try {
            const response = await fetch(
                `http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_Delete&IDNumber=${deleteDialog.record.IDNumber}`
            );
            const result = await response.json();

            if (result?.[0]?.ErrCode === '1' || result?.status === 'success') {
                showSnackbar('Sales order deleted successfully', 'success');
                await fetchMasterData();
                setDeleteDialog({ open: false, record: null });
            } else {
                showSnackbar(result?.[0]?.ErrMsg || 'Error deleting sales order', 'error');
            }
        } catch (error) {
            showSnackbar('Error deleting sales order: ' + error.message, 'error');
        }
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleChangePage = (_event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleSortChange = (event) => setSortOrder(event.target.value);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress size={50} thickness={4} />
            </Box>
        );
    }

    const currentPageData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2 }}>
            <Paper
                elevation={8}
                sx={{
                    maxWidth: '1600px',
                    width: '100%',
                    margin: '0 auto',
                    p: 3,
                    borderRadius: 3,
                }}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Sales Order Master
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Manage your sales orders with expandable details
                    </Typography>
                </Box>

                <Box
                    sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Sort Order</InputLabel>
                        <Select value={sortOrder} label="Sort Order" onChange={handleSortChange}>
                            <MenuItem value="newest">Newest First</MenuItem>
                            <MenuItem value="oldest">Oldest First</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchMasterData}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddNew}
                        >
                            Add New
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>SO No</TableCell>
                                <TableCell>SO Date</TableCell>
                                <TableCell>Division</TableCell>
                                <TableCell>SO Type</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Created By</TableCell>
                                <TableCell>Updated Date</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        No sales orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageData.map((row) => (
                                    <React.Fragment key={row.IDNumber}>
                                        <TableRow hover>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleChildGrid(row.IDNumber)}
                                                >
                                                    {expandedRows.has(row.IDNumber)
                                                        ? <CollapseIcon />
                                                        : <ExpandIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={row.SONo} size="small" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>{row.SODate}</TableCell>
                                            <TableCell>{row.Division}</TableCell>
                                            <TableCell>{row.SOType}</TableCell>
                                            <TableCell>{row.CustomerName}</TableCell>
                                            <TableCell>{row.CreatedBy}</TableCell>
                                            <TableCell>{row.UpdatedDate}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEdit(row)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                            setDeleteDialog({ open: true, record: row })
                                                        }
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>

                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ py: 0, border: 0 }}>
                                                <Collapse
                                                    in={expandedRows.has(row.IDNumber)}
                                                    timeout="auto"
                                                    unmountOnExit
                                                >
                                                    <Box sx={{ py: 2, px: 2 }}>
                                                        <SalesOrderGridMUI soId={row.IDNumber} readOnly={true} />
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 20]}
                />
            </Paper>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, record: null })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete Sales Order{' '}
                    <strong>{deleteDialog.record?.SONo}</strong>?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, record: null })}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SalesOrderList;
