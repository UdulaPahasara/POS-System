import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Typography, Box 
} from '@mui/material';

const UserDialog = ({ open, handleClose, user, isEditing }) => {
    const defaultForm = {
        username: '', email: '', password: '', phone: '', role: 'Cashier', status: 'Active'
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        if (open) {
            if (isEditing && user) {
                setFormData({ ...user, password: '' }); // Don't show password on edit
            } else {
                setFormData(defaultForm);
            }
        }
    }, [open, isEditing, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.username || !formData.email || (!isEditing && !formData.password)) {
            alert('Username, Email, and Password (for new users) are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = isEditing ? `http://localhost:5000/api/users/${user._id}` : 'http://localhost:5000/api/users';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = { ...formData };
            // If editing and password field is empty, don't send it to prevent hashing an empty string
            if (isEditing && !payload.password) {
                delete payload.password;
            }

            const response = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                handleClose(true); // true means refresh needed
            } else {
                const resData = await response.json();
                alert(resData.message || 'Error saving user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Server error while saving user');
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => handleClose(false)}
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
                {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        sx={inputStyles}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        sx={inputStyles}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        sx={inputStyles}
                    />
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        sx={inputStyles}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        sx={inputStyles}
                    >
                        <MenuItem value="Admin">Admin</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Cashier">Cashier</MenuItem>
                        <MenuItem value="Inventory Staff">Inventory Staff</MenuItem>
                    </TextField>
                    <TextField
                        select
                        fullWidth
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        sx={inputStyles}
                    >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                        <MenuItem value="Suspended">Suspended</MenuItem>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Button onClick={() => handleClose(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>
                    {isEditing ? 'Save Changes' : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
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

export default UserDialog;
