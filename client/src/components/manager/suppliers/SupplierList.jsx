import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, DialogContentText, Select, MenuItem, FormControl, InputLabel, Fade, Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, History as HistoryIcon } from '@mui/icons-material';
import { useNotifications } from '../../../context/NotificationContext';
import { suppliersApi } from '../../../services/suppliersApi';
import { categoriesApi } from '../../../services/categoriesApi';
import { productsApi } from '../../../services/productsApi';
import { branchesApi } from '../../../services/branchesApi';

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [supplierHistory, setSupplierHistory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role?.roleName === 'Admin' || user?.role === 'Admin' || user?.role?.roleName === 'Super Admin';

    const defaultForm = { supplierName: '', category: '', branches: [], items: [], contactPerson: '', phone: '', email: '', address: '' };
    const [formData, setFormData] = useState(defaultForm);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchSuppliers = async () => {
        try {
            const data = await suppliersApi.getAllSuppliers();
            if (data) setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAllCategories();
            if (data) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAllProducts();
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await branchesApi.getAllBranches();
            if (data) setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchCategories();
        fetchProducts();
        if (isAdmin) fetchBranches();
    }, [isAdmin]);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'SUPPLIER' || data.type === 'CATEGORY' || data.type === 'PRODUCT') {
                fetchSuppliers();
                if (data.type === 'CATEGORY') fetchCategories();
                if (data.type === 'PRODUCT') fetchProducts();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const handleOpen = (supplier = null) => {
        if (supplier) {
            setIsEditing(true);
            setCurrentId(supplier._id);
            setFormData({ 
                supplierName: supplier.supplierName || '', 
                category: supplier.category?._id || supplier.category || '',
                branches: supplier.branches?.map(b => b._id || b) || [],
                items: supplier.items?.map(i => i._id || i) || [],
                contactPerson: supplier.contactPerson || '', 
                phone: supplier.phone || '', 
                email: supplier.email || '', 
                address: supplier.address || '' 
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData(defaultForm);
        }
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                await suppliersApi.updateSupplier(currentId, formData);
            } else {
                await suppliersApi.createSupplier(formData);
            }

            fetchSuppliers();
            handleClose();
            setSnackbar({ open: true, message: `Supplier ${isEditing ? 'updated' : 'added'} successfully!`, severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
    };

    const handleDeleteClick = (id) => {
        setCurrentId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await suppliersApi.deleteSupplier(currentId);
            fetchSuppliers();
            setSnackbar({ open: true, message: 'Supplier deleted!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
        setDeleteDialogOpen(false);
    };

    const handleViewHistory = async (supplier) => {
        setCurrentId(supplier._id);
        try {
            const data = await suppliersApi.getSupplierHistory(supplier._id);
            if (data) {
                setSupplierHistory(data);
                setHistoryDialogOpen(true);
            }
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mb: 3 
            }}>
                <Typography 
                    variant="h4" 
                    sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                >
                    Suppliers
                </Typography>
                {isAdmin && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                        Add Supplier
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} sx={{ 
                bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Supplier Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Category</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contact Person</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Phone</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8', borderBottom: 'none', py: 4 }}>
                                    No suppliers found. Click "Add Supplier" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((sup, index) => (
                                <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={sup._id}>
                                <TableRow 
                                    sx={{ 
                                        '&:hover': { 
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                            position: 'relative'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.supplierName}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.category?.name || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.contactPerson || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.phone || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.email || 'N/A'}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <IconButton onClick={() => handleViewHistory(sup)} sx={{ color: '#10b981' }} size="small" title="View History"><HistoryIcon fontSize="small" /></IconButton>
                                        {isAdmin && (
                                            <>
                                                <IconButton onClick={() => handleOpen(sup)} sx={{ color: '#60a5fa' }} size="small" title="Edit"><EditIcon fontSize="small" /></IconButton>
                                                <IconButton onClick={() => handleDeleteClick(sup._id)} sx={{ color: '#ef4444' }} size="small" title="Delete"><DeleteIcon fontSize="small" /></IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                                </Fade>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={handleClose} 
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#0f172a',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: '500px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>
                    {isEditing ? 'Edit Supplier' : 'Add Supplier'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField 
                            fullWidth label="Supplier Name" required
                            value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                            sx={inputStyles}
                        />
                        <FormControl fullWidth sx={inputStyles}>
                            <InputLabel id="category-select-label">Category</InputLabel>
                            <Select
                                labelId="category-select-label"
                                value={formData.category}
                                label="Category"
                                onChange={(e) => setFormData({...formData, category: e.target.value, items: []})}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {categories.map(cat => (
                                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth sx={inputStyles}>
                            <InputLabel id="branches-select-label">Whitelisted Branches</InputLabel>
                            <Select
                                labelId="branches-select-label"
                                multiple
                                value={formData.branches}
                                label="Whitelisted Branches"
                                onChange={(e) => setFormData({...formData, branches: e.target.value})}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map(id => {
                                            const name = branches.find(b => b._id === id)?.name;
                                            return name ? (
                                                <Chip 
                                                    key={id} 
                                                    label={name} 
                                                    size="small" 
                                                    sx={{ color: '#fff', bgcolor: 'rgba(59, 130, 246, 0.2)', '& .MuiChip-deleteIcon': { color: '#94a3b8', '&:hover': { color: '#fff' } } }}
                                                    onDelete={() => setFormData(prev => ({...prev, branches: prev.branches.filter(b => b !== id)}))}
                                                    onMouseDown={(e) => e.stopPropagation()} 
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {branches.map(branch => (
                                    <MenuItem key={branch._id} value={branch._id}>{branch.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth sx={inputStyles}>
                            <InputLabel id="items-select-label">Items (Products)</InputLabel>
                            <Select
                                labelId="items-select-label"
                                multiple
                                value={formData.items}
                                label="Items (Products)"
                                onChange={(e) => setFormData({...formData, items: e.target.value})}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map(id => {
                                            const name = products.find(p => String(p._id) === String(id))?.name;
                                            return name ? (
                                                <Chip 
                                                    key={id} 
                                                    label={name} 
                                                    size="small" 
                                                    sx={{ color: '#fff', bgcolor: 'rgba(16, 185, 129, 0.2)', '& .MuiChip-deleteIcon': { color: '#94a3b8', '&:hover': { color: '#fff' } } }}
                                                    onDelete={() => setFormData(prev => ({...prev, items: prev.items.filter(i => String(i) !== String(id))}))}
                                                    onMouseDown={(e) => e.stopPropagation()} 
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {(formData.category 
                                    ? products.filter(p => {
                                        const catId = p.category?._id || p.category;
                                        return String(catId) === String(formData.category);
                                    })
                                    : products
                                ).map(prod => (
                                    <MenuItem key={prod._id} value={prod._id}>{prod.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField 
                            fullWidth label="Contact Person" 
                            value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                            sx={inputStyles}
                        />
                        <TextField 
                            fullWidth label="Phone" 
                            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            sx={inputStyles}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField 
                            fullWidth label="Email" type="email"
                            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                            sx={inputStyles}
                        />
                        <Box sx={{ flex: 1 }} />
                    </Box>
                    <TextField 
                        fullWidth label="Address" multiline rows={3}
                        value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                        sx={inputStyles}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={handleClose} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)} 
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#0f172a',
                        color: '#fff',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            >
                <DialogTitle>Delete Supplier?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>Are you sure? This cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* History Dialog */}
            <Dialog 
                open={historyDialogOpen} 
                onClose={() => setHistoryDialogOpen(false)} 
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#0f172a',
                        color: '#fff',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>Purchase Order History</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8' }}>PO Number</TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>Date</TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>Total Cost</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {supplierHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ color: '#94a3b8', py: 3 }}>No purchase history found for this supplier.</TableCell>
                                </TableRow>
                            ) : (
                                supplierHistory.map((po, index) => (
                                    <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={po._id}>
                                    <TableRow sx={{ 
                                        '&:hover': { 
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                            position: 'relative'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{po.poNumber}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{po.status}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LKR {po.totalCost?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    </Fade>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setHistoryDialogOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
        '& .MuiSvgIcon-root': { color: '#94a3b8' },
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};

export default SupplierList;
