import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, List, ListItem, ListItemText, IconButton, Box, Typography, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
    const [adding, setAdding] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0 = Search, 1 = Add New
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const isEmailValid = !newCustomer.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email);
    const isPhoneValid = !newCustomer.phone || /^\+?[\d\s-]{9,15}$/.test(newCustomer.phone);
    const isFormValid = newCustomer.name.trim() !== '' && isEmailValid && isPhoneValid;

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

    const handleAdd = async () => {
        setAdding(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const resp = await fetch('http://localhost:5000/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newCustomer),
            });
            if (resp.ok) {
                const created = await resp.json();
                setNewCustomer({ name: '', email: '', phone: '' }); // Clear form
                setActiveTab(0); // Reset to search tab for next open
                setSnackbar({ open: true, message: 'Customer added successfully!' });
                onSelect(created);
                onClose();
            }
        } catch (e) {
            console.error('Add customer error', e);
        }
        setAdding(false);
    };

    const handleSelect = (cust) => {
        onSelect(cust);
        setActiveTab(0); // reset tab
        onClose();
    };

    return (
        <>
        <Dialog open={open} onClose={() => { setActiveTab(0); onClose(); }} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Select Customer</Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, val) => setActiveTab(val)} 
                    variant="fullWidth" 
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', bgcolor: 'rgba(255,255,255,0.02)' }}
                >
                    <Tab label="Search Existing" sx={{ fontWeight: 600, textTransform: 'none', py: 2 }} />
                    <Tab label="Add New Customer" sx={{ fontWeight: 600, textTransform: 'none', py: 2 }} />
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
                                    button 
                                    key={c._id} 
                                    onClick={() => handleSelect(c)}
                                    sx={{ 
                                        borderRadius: 1, 
                                        mb: 0.5,
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' }
                                    }}
                                >
                                    <ListItemText 
                                        primary={<Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>} 
                                        secondary={`${c.email} • ${c.phone}`} 
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

                {/* ADD NEW TAB */}
                {activeTab === 1 && (
                    <Box sx={{ p: 3, minHeight: '300px' }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={newCustomer.name}
                            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={newCustomer.email}
                            onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            error={!isEmailValid && newCustomer.email.length > 0}
                            helperText={!isEmailValid && newCustomer.email.length > 0 ? "Invalid email format" : ""}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            label="Phone"
                            value={newCustomer.phone}
                            onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            error={!isPhoneValid && newCustomer.phone.length > 0}
                            helperText={!isPhoneValid && newCustomer.phone.length > 0 ? "Invalid phone number" : ""}
                            sx={{ mb: 3 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAdd}
                                disabled={adding || !isFormValid}
                                sx={{ py: 1.5, px: 3, fontWeight: 600, borderRadius: 2 }}
                            >
                                Save Customer
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
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
        </>
    );
};

export default CustomerSelect;
