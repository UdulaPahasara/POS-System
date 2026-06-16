import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, DialogContentText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, History as HistoryIcon } from '@mui/icons-material';

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [supplierHistory, setSupplierHistory] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    const defaultForm = { supplierName: '', contactPerson: '', phone: '', email: '', address: '' };
    const [formData, setFormData] = useState(defaultForm);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/suppliers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpen = (supplier = null) => {
        if (supplier) {
            setIsEditing(true);
            setCurrentId(supplier._id);
            setFormData({ 
                supplierName: supplier.supplierName || '', 
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
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = isEditing ? `http://localhost:5000/api/suppliers/${currentId}` : 'http://localhost:5000/api/suppliers';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchSuppliers();
                handleClose();
                setSnackbar({ open: true, message: `Supplier ${isEditing ? 'updated' : 'added'} successfully!`, severity: 'success' });
            } else {
                const errorData = await res.json();
                setSnackbar({ open: true, message: errorData.message || 'Error saving supplier', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
    };

    const handleDeleteClick = (id) => {
        setCurrentId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/suppliers/${currentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchSuppliers();
                setSnackbar({ open: true, message: 'Supplier deleted!', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
        setDeleteDialogOpen(false);
    };

    const handleViewHistory = async (supplier) => {
        setCurrentId(supplier._id);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/suppliers/${supplier._id}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSupplierHistory(data);
                setHistoryDialogOpen(true);
            } else {
                setSnackbar({ open: true, message: 'Failed to load history', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Suppliers</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                    Add Supplier
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Supplier Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contact Person</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Phone</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', borderBottom: 'none', py: 4 }}>
                                    No suppliers found. Click "Add Supplier" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((sup) => (
                                <TableRow key={sup._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.supplierName}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.contactPerson || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.phone || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{sup.email || 'N/A'}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <IconButton onClick={() => handleViewHistory(sup)} sx={{ color: '#10b981' }} size="small" title="View History"><HistoryIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleOpen(sup)} sx={{ color: '#60a5fa' }} size="small" title="Edit"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDeleteClick(sup._id)} sx={{ color: '#ef4444' }} size="small" title="Delete"><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
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
                        <TextField 
                            fullWidth label="Contact Person" 
                            value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                            sx={inputStyles}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField 
                            fullWidth label="Phone" 
                            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            sx={inputStyles}
                        />
                        <TextField 
                            fullWidth label="Email" type="email"
                            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                            sx={inputStyles}
                        />
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
                                supplierHistory.map(po => (
                                    <TableRow key={po._id}>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{po.poNumber}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{po.status}</TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LKR {po.totalCost?.toFixed(2)}</TableCell>
                                    </TableRow>
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
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};

export default SupplierList;
