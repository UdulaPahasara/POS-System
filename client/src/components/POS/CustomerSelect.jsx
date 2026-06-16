import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, List, ListItem, ListItemText, IconButton, Box, Typography, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

/**
 * CustomerSelect component allows cashiers to:
 *   • Search existing customers (by name, email or phone)
 *   • Add a new customer on the fly
 * It returns the selected customer via the onSelect callback.
 */
const CustomerSelect = ({ open, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({ id: null, name: '', email: '', phone: '', address: '' });
    const [adding, setAdding] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0 = Search, 1 = Add/Edit
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isEmailValid = !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const isPhoneValid = !formData.phone || /^\+?[\d\s-]{9,15}$/.test(formData.phone);
    const isFormValid = formData.name.trim() !== '' && isEmailValid && isPhoneValid;

    // Load customers when dialog opens or when search changes
    useEffect(() => {
        if (!open) return;
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const resp = await fetch(`http://localhost:5000/api/customers?search=${encodeURIComponent(search)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setCustomers(data);
                }
            } catch (e) {
                console.error('Failed to fetch customers', e);
            }
        };
        fetchCustomers();
    }, [open, search]);

    const handleSave = async () => {
        setAdding(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = formData.id ? `http://localhost:5000/api/customers/${formData.id}` : 'http://localhost:5000/api/customers';
            const method = formData.id ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            
            if (resp.ok) {
                const saved = await resp.json();
                setFormData({ id: null, name: '', email: '', phone: '', address: '' }); // Clear form
                setActiveTab(0); // Reset to search tab for next open
                setSnackbar({ open: true, message: formData.id ? 'Customer updated successfully!' : 'Customer added successfully!', severity: 'success' });
                onSelect(saved);
                onClose();
            } else {
                const errData = await resp.json();
                setSnackbar({ open: true, message: errData.message || 'Error saving customer', severity: 'error' });
            }
        } catch (e) {
            console.error('Save customer error', e);
            setSnackbar({ open: true, message: 'Network error', severity: 'error' });
        }
        setAdding(false);
    };

    const handleClose = () => {
        setFormData({ id: null, name: '', email: '', phone: '', address: '' });
        setActiveTab(0);
        onClose();
    };

    return (
        <>
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Select Customer</Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, val) => {
                        setActiveTab(val);
                        if (val === 1 && !formData.id) {
                            // If user clicked the tab directly without an ID, ensure form is clean for "Add"
                            setFormData({ id: null, name: '', email: '', phone: '', address: '' });
                        }
                    }} 
                    variant="fullWidth" 
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', bgcolor: 'rgba(255,255,255,0.02)' }}
                >
                    <Tab label="Search Existing" sx={{ fontWeight: 600, textTransform: 'none', py: 2 }} />
                    <Tab label={formData.id ? "Edit Customer" : "Add New Customer"} sx={{ fontWeight: 600, textTransform: 'none', py: 2 }} />
                </Tabs>

                {/* SEARCH TAB */}
                {activeTab === 0 && (
                    <Box sx={{ p: 3, minHeight: '300px' }}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, email or phone"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <List dense sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {customers.map(c => (
                                <ListItem 
                                    button={false}
                                    key={c._id} 
                                    secondaryAction={
                                        <IconButton 
                                            edge="end" 
                                            aria-label="edit" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setFormData({ id: c._id, name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }); 
                                                setActiveTab(1); 
                                            }}
                                        >
                                            <EditIcon sx={{ color: '#94a3b8' }} />
                                        </IconButton>
                                    }
                                    sx={{ 
                                        borderRadius: 1, 
                                        mb: 0.5,
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleSelect(c)}
                                >
                                    <ListItemText 
                                        primary={<Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>} 
                                        secondary={`${c.email || 'N/A'} • ${c.phone || 'N/A'}`} 
                                    />
                                </ListItem>
                            ))}
                            {customers.length === 0 && search && (
                                <Typography sx={{ color: '#94a3b8', textAlign: 'center', mt: 4 }}>
                                    No customers found. Try adding a new one!
                                </Typography>
                            )}
                        </List>
                    </Box>
                )}

                {/* ADD / EDIT TAB */}
                {activeTab === 1 && (
                    <Box sx={{ p: 3, minHeight: '300px' }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            error={!isEmailValid && formData.email.length > 0}
                            helperText={!isEmailValid && formData.email.length > 0 ? "Invalid email format" : ""}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            error={!isPhoneValid && formData.phone.length > 0}
                            helperText={!isPhoneValid && formData.phone.length > 0 ? "Invalid phone number" : ""}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            label="Address"
                            multiline
                            rows={2}
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            sx={{ mb: 3 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            {formData.id && (
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                        setFormData({ id: null, name: '', email: '', phone: '', address: '' });
                                        setActiveTab(0);
                                    }}
                                    sx={{ py: 1.5, px: 3, mr: 2, fontWeight: 600, borderRadius: 2 }}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={formData.id ? <EditIcon /> : <AddIcon />}
                                onClick={handleSave}
                                disabled={adding || !isFormValid}
                                sx={{ py: 1.5, px: 3, fontWeight: 600, borderRadius: 2 }}
                            >
                                {formData.id ? 'Update Customer' : 'Save Customer'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
        <Snackbar 
            open={snackbar.open} 
            autoHideDuration={4000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
        </>
    );
};

export default CustomerSelect;
