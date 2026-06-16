import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const PurchaseReturnList = () => {
    const [returns, setReturns] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    
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
    const canReturn = permissions.includes('RECEIVE_INVENTORY') || isAdmin || roleName === 'Manager' || roleName === 'Inventory Staff';

    useEffect(() => {
        fetchData();
    }, []);

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
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        try {
            const [prRes, pRes, sRes] = await Promise.all([
                fetch('http://localhost:5000/api/purchase-returns', { headers }),
                fetch('http://localhost:5000/api/products', { headers }),
                fetch('http://localhost:5000/api/suppliers', { headers })
            ]);
            
            if (prRes.ok) setReturns(await prRes.json());
            if (pRes.ok) setProducts(await pRes.json());
            if (sRes.ok) setSuppliers(await sRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCreate = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        let totalRefund = 0;
        formData.items.forEach(i => { totalRefund += i.refundCost; });

        try {
            const res = await fetch('http://localhost:5000/api/purchase-returns', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    supplier: formData.supplier, 
                    items: formData.items, 
                    totalRefund,
                    reason: formData.reason
                })
            });
            if (res.ok) {
                setOpenAdd(false);
                setFormData({ supplier: '', items: [], reason: '' });
                fetchData();
                setSnackbar({ open: true, message: 'Return created successfully', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to create return', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
    };

    const handleApprove = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/purchase-returns/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                setSnackbar({ open: true, message: 'Return approved', severity: 'success' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleShip = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/purchase-returns/${id}/return`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                setSnackbar({ open: true, message: 'Return shipped and stock updated', severity: 'success' });
            }
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

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>Purchase Returns</Typography>
                {canCreate && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
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
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pr.status}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {canApprove && pr.status === 'Pending' && (
                                            <Button size="small" variant="outlined" color="info" onClick={() => handleApprove(pr._id)} sx={{ textTransform: 'none' }}>Approve</Button>
                                        )}
                                        {canReturn && pr.status === 'Approved' && (
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
                onClose={() => setOpenAdd(false)} 
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
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>Create Purchase Return</DialogTitle>
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
                                <Typography key={idx} sx={{ color: '#fff', fontSize: '0.9rem', mb: 0.5 }}>
                                    • {pName} - Qty: {i.quantity} (Refund: LKR {i.refundCost})
                                </Typography>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
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
