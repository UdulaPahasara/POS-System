import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { Add, Close as CloseIcon, ViewCarousel, TableRows } from '@mui/icons-material';
import { useNotifications } from '../../../context/NotificationContext';
import { purchasingApi } from '../../../services/purchasingApi';
import { productsApi } from '../../../services/productsApi';
import { suppliersApi } from '../../../services/suppliersApi';
import { categoriesApi } from '../../../services/categoriesApi';

const PurchaseOrderList = () => {
    const location = useLocation();
    const [highlightedPoId, setHighlightedPoId] = useState(null);
    const [pos, setPos] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentEditingPoId, setCurrentEditingPoId] = useState(null);
    
    const [formData, setFormData] = useState({ supplier: '', items: [] });
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Fail-safe logic to handle if role is a string OR an object
    const userRoleObj = user?.role;
    const roleName = typeof userRoleObj === 'object' ? userRoleObj?.roleName : userRoleObj;
    const permissions = typeof userRoleObj === 'object' ? (userRoleObj?.permissions?.map(p => p.permissionName) || []) : [];
    
    const isAdmin = roleName === 'Admin';
    // Fallbacks just in case permissions array fails to load from an old session
    const canCreate = permissions.includes('CREATE_PO') || isAdmin || roleName === 'Manager' || roleName === 'Inventory Staff';
    const canApprove = permissions.includes('APPROVE_PO') || isAdmin || roleName === 'Manager';
    const canReceive = permissions.includes('RECEIVE_INVENTORY') || isAdmin || roleName === 'Inventory Staff';

    useEffect(() => {
        fetchData();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'PURCHASE_ORDER' || data.type === 'PRODUCT' || data.type === 'SUPPLIER' || data.type === 'CATEGORY') {
                fetchData();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    useEffect(() => {
        if (location.state?.highlightPoId && pos.length > 0) {
            const id = location.state.highlightPoId;
            setHighlightedPoId(id);
            
            setTimeout(() => {
                const element = document.getElementById('po-row-' + id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
            const timer = setTimeout(() => {
                setHighlightedPoId(null);
                window.history.replaceState({}, document.title);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [location.state, pos]);

    const fetchData = async () => {
        try {
            const [poRes, pRes, sRes, cRes] = await Promise.all([
                purchasingApi.getPurchaseOrders(),
                productsApi.getAllProducts(),
                suppliersApi.getAllSuppliers(),
                categoriesApi.getAllCategories()
            ]);
            
            if (poRes) setPos(poRes);
            if (pRes) setProducts(pRes);
            if (sRes) setSuppliers(sRes);
            if (cRes) setCategories(cRes);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async () => {
        let totalCost = 0;
        const formattedItems = formData.items.map(i => {
            const prod = products.find(p => p._id === i.product);
            const cost = prod ? prod.costPrice * i.quantity : 0;
            totalCost += cost;
            return { product: i.product, quantity: i.quantity, cost };
        });

        try {
            const payload = { supplier: formData.supplier, items: formattedItems, totalCost };
            if (isEditMode) {
                await purchasingApi.updatePurchaseOrder(currentEditingPoId, payload);
            } else {
                await purchasingApi.createPurchaseOrder(payload);
            }
            handleCloseDialog();
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        try {
            await purchasingApi.approvePurchaseOrder(id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReceive = async (id) => {
        try {
            await purchasingApi.receivePurchaseOrder(id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        const numericQty = Number(qty) || 0;
        if (!selectedProduct || numericQty <= 0) return;
        setFormData({
            ...formData,
            items: [...formData.items, { product: selectedProduct, quantity: numericQty }]
        });
        setSelectedProduct('');
        setQty('');
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleEdit = (po) => {
        setFormData({ 
            supplier: po.supplier?._id || po.supplier, 
            items: po.items.map(i => ({ product: i.product?._id || i.product, quantity: i.quantity })) 
        });
        setIsEditMode(true);
        setCurrentEditingPoId(po._id);
        setOpenAdd(true);
    };

    const handleCloseDialog = () => {
        setOpenAdd(false);
        setIsEditMode(false);
        setCurrentEditingPoId(null);
        setFormData({ supplier: '', items: [] });
        setSelectedProduct('');
        setQty('');
    };

    const selectedSupplierObj = suppliers.find(s => s._id === formData.supplier);
    const supplierItemIds = selectedSupplierObj?.items?.map(i => i._id || i) || [];
    
    let availableProducts = [];
    if (supplierItemIds.length > 0) {
        availableProducts = products.filter(p => supplierItemIds.includes(p._id));
    } else if (selectedSupplierObj) {
        const supplierCatId = selectedSupplierObj.category?._id || selectedSupplierObj.category;
        if (supplierCatId) {
            availableProducts = products.filter(p => (p.category?._id || p.category) === supplierCatId);
        }
    }

    const getProductDisplayInfo = (poItems) => {
        if (!poItems || poItems.length === 0) return { name: 'N/A', category: 'N/A' };
        
        const firstItemProdId = poItems[0].product?._id || poItems[0].product;
        const firstProd = products.find(p => p._id === firstItemProdId);
        
        let categoryName = 'Uncategorized';
        if (firstProd) {
            const catId = firstProd.category?._id || firstProd.category;
            const cat = categories.find(c => c._id === catId);
            if (cat) categoryName = cat.name;
        }

        const productNames = poItems.map(item => {
            const prodId = item.product?._id || item.product;
            const prod = products.find(p => p._id === prodId);
            return prod ? prod.name : 'Unknown Product';
        });
        
        return { 
            name: productNames.join(', '), 
            category: categoryName
        };
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>Purchase Orders</Typography>
                {canCreate && roleName !== 'Manager' && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setIsEditMode(false); setOpenAdd(true); }}>
                        Create PO
                    </Button>
                )}
            </Box>

            {/* Low Stock Suggestions */}
            {canCreate && roleName !== 'Manager' && products.filter(p => p.stock <= p.reorderLevel).length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ color: '#f59e0b', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        ⚠️ Low Stock Suggestions (Needs Reordering)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6, bgcolor: 'rgba(255,255,255,0.05)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(245, 158, 11, 0.5)', borderRadius: 3 } }}>
                        {products.filter(p => p.stock <= p.reorderLevel).map((p, index) => (
                            <Paper 
                                key={p._id}
                                sx={{ 
                                    minWidth: 220, 
                                    p: 2, 
                                    bgcolor: 'rgba(245, 158, 11, 0.05)', 
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: 3,
                                    flexShrink: 0,
                                    animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${0.1 + (index * 0.1)}s both`,
                                    '@keyframes slideUp': {
                                        '0%': { opacity: 0, transform: 'translateY(30px)' },
                                        '100%': { opacity: 1, transform: 'translateY(0)' }
                                    }
                                }}
                            >
                                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }} noWrap>{p.name}</Typography>
                                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1.5 }}>
                                    Stock: <span style={{ color: '#f87171', fontWeight: 700 }}>{p.stock}</span> • Reorder: {p.reorderLevel}
                                </Typography>
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ 
                                        color: '#f59e0b', 
                                        borderColor: '#f59e0b', 
                                        textTransform: 'none', 
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706' } 
                                    }}
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setOpenAdd(true);
                                        setSelectedProduct(p._id);
                                    }}
                                >
                                    + Create PO
                                </Button>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            )}

            <TableContainer component={Paper} sx={{ 
                bgcolor: '#1e293b', overflowX: 'hidden',
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>PO Number</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Supplier</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Category</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Product Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Total Cost</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Quantity</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pos.map((po) => {
                            const { name, category } = getProductDisplayInfo(po.items);
                            return (
                            <TableRow 
                                key={po._id} 
                                id={`po-row-${po._id}`}
                                sx={{ 
                                    '&:hover': { 
                                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                        zIndex: 10,
                                        position: 'relative'
                                    },
                                    bgcolor: highlightedPoId === po._id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <TableCell sx={{ color: '#fff' }}>{po.poNumber}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{po.supplier?.supplierName}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{category}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{name}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>LKR {po.totalCost?.toFixed(2)}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{po.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{po.status}</TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        {canCreate && roleName !== 'Manager' && po.status === 'Pending' && (
                                            <Button size="small" variant="outlined" color="info" sx={{ fontWeight: 600, borderRadius: 2 }} onClick={() => handleEdit(po)}>Edit</Button>
                                        )}
                                        {canApprove && po.status === 'Pending' && (
                                            <Button size="small" variant="contained" color="success" sx={{ fontWeight: 600, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }} onClick={() => handleApprove(po._id)}>Approve</Button>
                                        )}
                                        {canReceive && po.status === 'Approved' && (
                                            <Button size="small" variant="contained" color="primary" sx={{ fontWeight: 600, borderRadius: 2 }} onClick={() => handleReceive(po._id)}>Receive</Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create PO Dialog */}
            <Dialog 
                open={openAdd} 
                onClose={handleCloseDialog} 
                maxWidth="sm" 
                fullWidth 
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#0f172a',
                        color: '#fff',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>{isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField 
                        select fullWidth label="Supplier" margin="dense"
                        value={formData.supplier} 
                        onChange={(e) => {
                            setFormData({...formData, supplier: e.target.value, items: []});
                            setSelectedProduct('');
                            setQty('');
                        }}
                        sx={inputStyles}
                    >
                        {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.supplierName}</MenuItem>)}
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center' }}>
                        <TextField 
                            select fullWidth label="Product"
                            value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                            sx={inputStyles}
                            disabled={!formData.supplier}
                        >
                            {availableProducts.length === 0 && formData.supplier ? (
                                <MenuItem disabled value=""><em>No products assigned to this supplier</em></MenuItem>
                            ) : (
                                availableProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)
                            )}
                        </TextField>
                        <TextField 
                            type="number" label="Qty" sx={{ ...inputStyles, width: 100 }}
                            value={qty} onChange={(e) => setQty(e.target.value)}
                            disabled={!formData.supplier}
                        />
                        <Button variant="contained" onClick={addItem} disabled={!formData.supplier} sx={{ height: '53px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Add</Button>
                    </Box>

                    <Box sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="#94a3b8" sx={{ mb: 1 }}>Selected Items:</Typography>
                        {formData.items.length === 0 && <Typography variant="body2" color="#666">No items added yet.</Typography>}
                        {formData.items.map((i, idx) => {
                            const pName = products.find(p => p._id === i.product)?.name;
                            return (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>• {pName} - Qty: {i.quantity}</Typography>
                                    <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeItem(idx)}><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={!formData.supplier || formData.items.length === 0} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>Save PO</Button>
                </DialogActions>
            </Dialog>
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
        '& .MuiSelect-icon': { color: '#94a3b8' }
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
    '& .MuiMenu-paper': { bgcolor: '#1e293b', color: '#fff' }
};

export default PurchaseOrderList;
