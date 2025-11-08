import React, { useState, useEffect } from 'react';
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
    TextField,
    InputAdornment,
    Menu,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Divider,
    TableSortLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    KeyboardArrowDown as ExpandIcon,
    KeyboardArrowUp as CollapseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import SalesOrderGridMUI from './SalesOrderGridMUI';

const SalesOrderList = () => {
    const [masterData, setMasterData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        record: null
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [columnFilters, setColumnFilters] = useState({
        SONo: [],
        Division: [],
        SOType: [],
        CustomerName: [],
        CreatedBy: [],
    });

    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [activeFilterColumn, setActiveFilterColumn] = useState(null);
    const history = useHistory();
    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [masterData, searchText, sortColumn, sortDirection, columnFilters]);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://122.179.135.100:8095/wsDataPool/WebAPI.aspx?op=SAL_SalesOrderMaster_List'
            );
            const data = await response.json();
            setMasterData(data || []);
        } catch (error) {
            showSnackbar('Error fetching sales orders: ' + (error).message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSort = () => {
        let result = [...masterData];

        if (searchText.trim()) {
            const search = searchText.toLowerCase();
            result = result.filter((row) =>
                Object.values(row).some((val) =>
                    String(val).toLowerCase().includes(search)
                )
            );
        }

        Object.entries(columnFilters).forEach(([column, values]) => {
            if (values.length > 0) {
                result = result.filter((row) =>
                    values.includes(row[column])
                );
            }
        });

        if (sortColumn) {
            result.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                let comparison = 0;

                if (sortColumn === 'SODate' || sortColumn === 'UpdatedDate') {
                    const dateA = new Date(aVal || 0).getTime();
                    const dateB = new Date(bVal || 0).getTime();
                    comparison = dateA - dateB;
                } else if (sortColumn === 'SONo') {
                    const numA = parseInt(String(aVal).replace(/\D/g, '') || '0');
                    const numB = parseInt(String(bVal).replace(/\D/g, '') || '0');
                    comparison = numA - numB;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        setFilteredData(result);
        setPage(0);
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const openFilterMenu = (event, column) => {
        setFilterMenuAnchor(event.currentTarget);
        setActiveFilterColumn(column);
    };

    const closeFilterMenu = () => {
        setFilterMenuAnchor(null);
        setActiveFilterColumn(null);
    };

    const getUniqueValues = (column) => {
        const values = masterData.map((row) => row[column]).filter(Boolean);
        return Array.from(new Set(values)).sort();
    };

    const toggleFilterValue = (column, value) => {
        setColumnFilters((prev) => {
            const current = prev[column];
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, [column]: updated };
        });
    };

    const clearColumnFilter = (column) => {
        setColumnFilters((prev) => ({ ...prev, [column]: [] }));
    };

    const clearAllFilters = () => {
        setColumnFilters({
            SONo: [],
            Division: [],
            SOType: [],
            CustomerName: [],
            CreatedBy: [],
        });
        setSearchText('');
        setSortColumn(null);
        setSortDirection('asc');
    };

    const toggleChildGrid = (rowId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(rowId)) {
            newExpanded.delete(rowId);
        } else {
            newExpanded.add(rowId);
        }
        setExpandedRows(newExpanded);
    };

    const handleEdit = (row) => {
        history.push(`/sales-order/edit/${row.IDNumber}`);
    };

    const handleAddNew = () => {
        history.push('/sales-order/new');
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
            showSnackbar('Error deleting sales order: ' + (error).message, 'error');
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

    const getActiveFilterCount = () => {
        return Object.values(columnFilters).reduce((sum, arr) => sum + arr.length, 0);
    };

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
    const activeFilterCount = getActiveFilterCount();

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', py: 3, px: 2, bgcolor: '#f5f5f5' }}>
            <Paper
                elevation={3}
                sx={{
                    maxWidth: '1600px',
                    width: '100%',
                    margin: '0 auto',
                    p: 3,
                    borderRadius: 2,
                }}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
                        Sales Order Master
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Manage your sales orders with expandable details
                    </Typography>
                </Box>

                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search all columns..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchText && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchText('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {(activeFilterCount > 0 || searchText || sortColumn) && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ClearIcon />}
                                onClick={clearAllFilters}
                            >
                                Clear All ({activeFilterCount + (searchText ? 1 : 0)})
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchMasterData}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAddNew}
                        >
                            Add New
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }} />

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TableSortLabel
                                            active={sortColumn === 'SONo'}
                                            direction={sortColumn === 'SONo' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('SONo')}
                                        >
                                            SO No
                                        </TableSortLabel>
                                        {/* <IconButton
                                            size="small"
                                            onClick={(e) => openFilterMenu(e, 'SONo')}
                                            sx={{
                                                p: 0.5,
                                                color: columnFilters.SONo.length > 0 ? '#1976d2' : 'inherit'
                                            }}
                                        >
                                            <FilterIcon fontSize="small" />
                                        </IconButton> */}
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <TableSortLabel
                                        active={sortColumn === 'SODate'}
                                        direction={sortColumn === 'SODate' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('SODate')}
                                    >
                                        SO Date
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TableSortLabel
                                            active={sortColumn === 'Division'}
                                            direction={sortColumn === 'Division' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('Division')}
                                        >
                                            Division
                                        </TableSortLabel>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openFilterMenu(e, 'Division')}
                                            sx={{
                                                p: 0.5,
                                                color: columnFilters.Division.length > 0 ? '#1976d2' : 'inherit'
                                            }}
                                        >
                                            <FilterIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TableSortLabel
                                            active={sortColumn === 'SOType'}
                                            direction={sortColumn === 'SOType' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('SOType')}
                                        >
                                            SO Type
                                        </TableSortLabel>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openFilterMenu(e, 'SOType')}
                                            sx={{
                                                p: 0.5,
                                                color: columnFilters.SOType.length > 0 ? '#1976d2' : 'inherit'
                                            }}
                                        >
                                            <FilterIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TableSortLabel
                                            active={sortColumn === 'CustomerName'}
                                            direction={sortColumn === 'CustomerName' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('CustomerName')}
                                        >
                                            Customer
                                        </TableSortLabel>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openFilterMenu(e, 'CustomerName')}
                                            sx={{
                                                p: 0.5,
                                                color: columnFilters.CustomerName.length > 0 ? '#1976d2' : 'inherit'
                                            }}
                                        >
                                            <FilterIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TableSortLabel
                                            active={sortColumn === 'CreatedBy'}
                                            direction={sortColumn === 'CreatedBy' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('CreatedBy')}
                                        >
                                            Created By
                                        </TableSortLabel>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openFilterMenu(e, 'CreatedBy')}
                                            sx={{
                                                p: 0.5,
                                                color: columnFilters.CreatedBy.length > 0 ? '#1976d2' : 'inherit'
                                            }}
                                        >
                                            <FilterIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 600 }}>
                                    <TableSortLabel
                                        active={sortColumn === 'UpdatedDate'}
                                        direction={sortColumn === 'UpdatedDate' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('UpdatedDate')}
                                    >
                                        Updated Date
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                        <Typography color="textSecondary">
                                            No sales orders found
                                        </Typography>
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
                                                <Chip
                                                    label={row.SONo}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{row.SODate}</TableCell>
                                            <TableCell>{row.Division}</TableCell>
                                            <TableCell>{row.SOType}</TableCell>
                                            <TableCell sx={{ width: 200 }}>{row.CustomerName}</TableCell>
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
                                            <TableCell colSpan={9} sx={{ py: 0, border: 0, bgcolor: '#fafafa' }}>
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
                    rowsPerPageOptions={[5, 10, 20, 50]}
                />
            </Paper>

            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={closeFilterMenu}
                PaperProps={{
                    sx: { maxHeight: 400, minWidth: 200 },
                }}
            >
                {activeFilterColumn && (
                    <>
                        <Box sx={{ px: 2, py: 1, fontWeight: 600 }}>
                            Filter {activeFilterColumn}
                        </Box>
                        <Divider />
                        {getUniqueValues(activeFilterColumn).map((value) => (
                            <MenuItem
                                key={value}
                                onClick={() =>
                                    toggleFilterValue(activeFilterColumn, value)
                                }
                                dense
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        size="small"
                                        checked={columnFilters[activeFilterColumn].includes(value)}
                                    />
                                </ListItemIcon>
                                <ListItemText primary={value} />
                            </MenuItem>
                        ))}
                        {columnFilters[activeFilterColumn].length > 0 && (
                            <>
                                <Divider />
                                <MenuItem
                                    onClick={() => {
                                        clearColumnFilter(activeFilterColumn);
                                        closeFilterMenu();
                                    }}
                                >
                                    <ListItemIcon>
                                        <ClearIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Clear Filter" />
                                </MenuItem>
                            </>
                        )}
                    </>
                )}
            </Menu>

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
                    <Button onClick={() => setDeleteDialog({ open: false, record: null })}>
                        Cancel
                    </Button>
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
