import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNotifications } from '../../../context/NotificationContext';
import { purchasingApi } from '../../../services/purchasingApi';
import { productsApi } from '../../../services/productsApi';
import { suppliersApi } from '../../../services/suppliersApi';

const PurchaseReturnList = () => {
    const [returns, setReturns] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentEditingPoId, setCurrentEditingPoId] = useState(null);
    
    const [formData, setFormData] = useState({ supplier: '', items: [], reason: '' });
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [refundAmount, setRefundAmount] = useState('');

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Fail-safe logic to handle if role is a string OR an object
    const userRoleObj = user?.role;
    const roleName = typeof userRoleObj === 'object' ? userRoleObj?.roleName : userRoleObj;
    const permissions = typeof userRoleObj === 'object' ? (userRoleObj?.permissions?.map(p => p.permissionName) || []) : [];
    
    const isAdmin = roleName === 'Admin';
    const canCreate = permissions.includes('CREATE_PO') || isAdmin || roleName === 'Manager' || roleName === 'Inventory Staff';
    const canApprove = permissions.includes('APPROVE_PO') || isAdmin || roleName === 'Manager';
    const canReturn = permissions.includes('RECEIVE_INVENTORY') || isAdmin || roleName === 'Inventory Staff';

    useEffect(() => {
        fetchData();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'PURCHASE_RETURN' || data.type === 'PRODUCT' || data.type === 'SUPPLIER') {
                fetchData();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    useEffect(() => {
        if (selectedProduct) {
            const prod = products.find(p => p._id === selectedProduct);
            if (prod && prod.costPrice) {
                const numericQty = Number(qty) || 0;
                setRefundAmount((prod.costPrice * numericQty).toString());
            }
        } else {
            setRefundAmount('');
        }
    }, [selectedProduct, qty, products]);

    const fetchData = async () => {
        try {
            const [prData, pData, sData] = await Promise.all([
                purchasingApi.getPurchaseReturns(),
                productsApi.getAllProducts(),
                suppliersApi.getAllSuppliers()
            ]);
            
            if (prData) setReturns(prData);
            if (pData) setProducts(pData);
            if (sData) setSuppliers(sData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCreate = async () => {
        let totalRefund = 0;
        formData.items.forEach(i => { totalRefund += i.refundCost; });

        try {
            const payload = { 
                supplier: formData.supplier, 
                items: formData.items, 
                totalRefund,
                reason: formData.reason
            };

            if (isEditMode) {
                await purchasingApi.updatePurchaseReturn(currentEditingPoId, payload);
            } else {
                await purchasingApi.createPurchaseReturn(payload);
            }

            handleCloseDialog();
            fetchData();
            setSnackbar({ open: true, message: `Return ${isEditMode ? 'updated' : 'created'} successfully`, severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
    };

    const handleApprove = async (id) => {
        try {
            await purchasingApi.approvePurchaseReturn(id);
            fetchData();
            setSnackbar({ open: true, message: 'Return approved', severity: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleShip = async (id) => {
        try {
            await purchasingApi.shipPurchaseReturn(id);
            fetchData();
            setSnackbar({ open: true, message: 'Return shipped and stock updated', severity: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        const numericQty = Number(qty) || 0;
        if (!selectedProduct || numericQty <= 0) return;
        setFormData({
            ...formData,
            items: [...formData.items, { product: selectedProduct, quantity: numericQty, refundCost: Number(refundAmount) || 0 }]
        });
        setSelectedProduct('');
        setQty('');
        setRefundAmount('');
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleEdit = (pr) => {
        setFormData({ 
            supplier: pr.supplier?._id || pr.supplier, 
            reason: pr.reason,
            items: pr.items.map(i => ({ product: i.product?._id || i.product, quantity: i.quantity, refundCost: i.refundCost })) 
        });
        setIsEditMode(true);
        setCurrentEditingPoId(pr._id);
        setOpenAdd(true);
    };

    const handleCloseDialog = () => {
        setOpenAdd(false);
        setIsEditMode(false);
        setCurrentEditingPoId(null);
        setFormData({ supplier: '', items: [], reason: '' });
        setSelectedProduct('');
        setQty('');
        setRefundAmount('');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>Purchase Returns</Typography>
                {canCreate && roleName !== 'Manager' && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setIsEditMode(false); setOpenAdd(true); }} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                        Create Return
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Return Number</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Supplier</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Reason</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Total Refund</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Quantity</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {returns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8', py: 4, borderBottom: 'none' }}>No returns found.</TableCell>
                            </TableRow>
                        ) : (
                            returns.map((pr) => (
                                <TableRow key={pr._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.prNumber}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.supplier?.supplierName}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.reason}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LKR {pr.totalRefund?.toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.status}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {canCreate && roleName !== 'Manager' && pr.status === 'Pending' && (
                                            <Button size="small" variant="outlined" color="info" onClick={() => handleEdit(pr)} sx={{ mr: 1, textTransform: 'none' }}>Edit</Button>
                                        )}
                                        {canApprove && roleName !== 'Inventory Staff' && pr.status === 'Pending' && (
                                            <Button size="small" variant="outlined" color="success" onClick={() => handleApprove(pr._id)} sx={{ textTransform: 'none' }}>Approve</Button>
                                        )}
                                        {canReturn && roleName !== 'Manager' && pr.status === 'Approved' && (
                                            <Button size="small" variant="contained" color="warning" onClick={() => handleShip(pr._id)} sx={{ ml: 1, textTransform: 'none' }}>Ship & Deduct Stock</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create PR Dialog */}
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
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>{isEditMode ? 'Edit Purchase Return' : 'Create Purchase Return'}</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField 
                        select fullWidth label="Supplier" margin="dense"
                        value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        sx={inputStyles}
                    >
                        {suppliers.length === 0 && <MenuItem disabled value="">No suppliers available</MenuItem>}
                        {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.supplierName}</MenuItem>)}
                    </TextField>

                    <TextField 
                        fullWidth label="Reason for Return" margin="dense"
                        value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        sx={{ ...inputStyles, mt: 2 }}
                        placeholder="e.g. Damaged during delivery"
                    />

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 1, alignItems: 'center' }}>
                        <TextField 
                            select fullWidth label="Product"
                            value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                            sx={inputStyles}
                        >
                            {products.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                        </TextField>
                        <TextField 
                            type="number" label="Qty" sx={{ ...inputStyles, width: 100 }}
                            value={qty} onChange={(e) => setQty(e.target.value)}
                        />
                        <TextField 
                            type="number" label="Refund (LKR)" sx={{ ...inputStyles, width: 140 }}
                            value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                        />
                        <Button variant="contained" onClick={addItem} sx={{ height: '53px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Add</Button>
                    </Box>

                    <Box sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="#94a3b8" sx={{ mb: 1 }}>Selected Items to Return:</Typography>
                        {formData.items.length === 0 && <Typography variant="body2" color="#666">No items added yet.</Typography>}
                        {formData.items.map((i, idx) => {
                            const pName = products.find(p => p._id === i.product)?.name;
                            return (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                        • {pName} - Qty: {i.quantity} (Refund: LKR {i.refundCost})
                                    </Typography>
                                    <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeItem(idx)}><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={!formData.supplier || formData.items.length === 0 || !formData.reason} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>Save Return</Button>
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
        '& .MuiSelect-icon': { color: '#94a3b8' }
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
    '& .MuiMenu-paper': { bgcolor: '#1e293b', color: '#fff' }
};

export default PurchaseReturnList;
