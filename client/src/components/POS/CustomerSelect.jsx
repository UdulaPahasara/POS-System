import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, List, ListItem, ListItemText, IconButton, Box, Typography } from '@mui/material';
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
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Select Customer</Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {/* Search bar */}
                <TextField
                    fullWidth
                    placeholder="Search by name, email or phone"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <List dense>
                    {customers.map(c => (
                        <ListItem button key={c._id} onClick={() => handleSelect(c)}>
                            <ListItemText primary={c.name} secondary={`${c.email} • ${c.phone}`} />
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ mt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Add New Customer</Typography>
                    <TextField
                        fullWidth
                        label="Name"
                        value={newCustomer.name}
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={newCustomer.email}
                        onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Phone"
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        sx={{ mb: 1 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        disabled={adding || !newCustomer.name}
                        sx={{ mt: 1 }}
                    >Add Customer</Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerSelect;
