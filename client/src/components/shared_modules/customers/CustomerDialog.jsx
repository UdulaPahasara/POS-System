import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    Box,
    Alert
} from '@mui/material';
import { customersApi } from '../../../services/customersApi';

const CustomerDialog = ({ open, handleClose, customer, refreshCustomers }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        loyaltyPoints: 0
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                loyaltyPoints: customer.loyaltyPoints || 0
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                loyaltyPoints: 0
            });
        }
        setError('');
    }, [customer, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.name || !formData.phone) {
            setError('Name and Phone are required');
            setLoading(false);
            return;
        }

        try {
            if (customer) {
                await customersApi.updateCustomer(customer._id, formData);
            } else {
                await customersApi.createCustomer(formData);
            }

            refreshCustomers();
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {customer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{ bgcolor: '#0f172a', color: '#fff', pt: 3 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2, ...textFieldStyle }}
                    />
                    
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2, ...textFieldStyle }}
                    />
                    
                    <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        sx={{ mb: 2, ...textFieldStyle }}
                    />

                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        sx={{ mb: 2, ...textFieldStyle }}
                    />

                    {customer && (
                        <TextField
                            fullWidth
                            label="Loyalty Points"
                            name="loyaltyPoints"
                            type="number"
                            value={formData.loyaltyPoints}
                            onChange={handleChange}
                            sx={{ mb: 2, ...textFieldStyle }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                    <Button onClick={handleClose} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading}
                        sx={{ bgcolor: '#3b82f6', textTransform: 'none' }}
                    >
                        {loading ? 'Saving...' : 'Save Customer'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

const textFieldStyle = {
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
    }
};

export default CustomerDialog;
