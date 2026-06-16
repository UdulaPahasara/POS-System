import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { Add } from '@mui/icons-material';

const PurchaseOrderList = () => {
    const [pos, setPos] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    
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
    const canReceive = permissions.includes('RECEIVE_INVENTORY') || isAdmin || roleName === 'Manager' || roleName === 'Inventory Staff';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        try {
            const [poRes, pRes, sRes] = await Promise.all([
                fetch('http://localhost:5000/api/purchase-orders', { headers }),
                fetch('http://localhost:5000/api/products', { headers }),
                fetch('http://localhost:5000/api/suppliers', { headers })
            ]);
            
            if (poRes.ok) setPos(await poRes.json());
            if (pRes.ok) setProducts(await pRes.json());
            if (sRes.ok) setSuppliers(await sRes.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Quick total cost calculation based on product costPrice
        let totalCost = 0;
        const formattedItems = formData.items.map(i => {
            const prod = products.find(p => p._id === i.product);
            const cost = prod ? prod.costPrice * i.quantity : 0;
            totalCost += cost;
            return { product: i.product, quantity: i.quantity, cost };
        });

        try {
            await fetch('http://localhost:5000/api/purchase-orders', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ supplier: formData.supplier, items: formattedItems, totalCost })
            });
            setOpenAdd(false);
            setFormData({ supplier: '', items: [] });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            await fetch(`http://localhost:5000/api/purchase-orders/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReceive = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            await fetch(`http://localhost:5000/api/purchase-orders/${id}/receive`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>Purchase Orders</Typography>
                {canCreate && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}>
                        Create PO
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>PO Number</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Supplier</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Total Cost</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pos.map((po) => (
                            <TableRow key={po._id}>
                                <TableCell sx={{ color: '#fff' }}>{po.poNumber}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{po.supplier?.supplierName}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>LKR {po.totalCost?.toFixed(2)}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{po.status}</TableCell>
                                <TableCell align="right">
                                    {canApprove && po.status === 'Pending' && (
                                        <Button size="small" color="success" onClick={() => handleApprove(po._id)}>Approve</Button>
                                    )}
                                    {canReceive && po.status === 'Approved' && (
                                        <Button size="small" color="primary" onClick={() => handleReceive(po._id)}>Receive</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create PO Dialog */}
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
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>Create Purchase Order</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField 
                        select fullWidth label="Supplier" margin="dense"
                        value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        sx={inputStyles}
                    >
                        {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.supplierName}</MenuItem>)}
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center' }}>
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
                        <Button variant="contained" onClick={addItem} sx={{ height: '53px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Add</Button>
                    </Box>

                    <Box sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="#94a3b8" sx={{ mb: 1 }}>Selected Items:</Typography>
                        {formData.items.length === 0 && <Typography variant="body2" color="#666">No items added yet.</Typography>}
                        {formData.items.map((i, idx) => {
                            const pName = products.find(p => p._id === i.product)?.name;
                            return <Typography key={idx} sx={{ color: '#fff', fontSize: '0.9rem', mb: 0.5 }}>• {pName} - Qty: {i.quantity}</Typography>;
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
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
