import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Typography, Box 
} from '@mui/material';
import { usersApi } from '../../../services/usersApi';
import { branchesApi } from '../../../services/branchesApi';

const UserDialog = ({ open, handleClose, user, isEditing }) => {
    const defaultForm = {
        username: '', email: '', password: '', phone: '', role: 'Cashier', status: 'Active', branch: ''
    };

    const [formData, setFormData] = useState(defaultForm);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchesApi.getAllBranches();
                setBranches(data);
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        if (open) {
            if (isEditing && user) {
                const roleValue = typeof user.role === 'object' ? (user.role?.roleName || 'Cashier') : (user.role || 'Cashier');
                const branchValue = typeof user.branch === 'object' && user.branch ? user.branch._id : (user.branch || '');
                setFormData({ ...user, role: roleValue, branch: branchValue, password: '' }); // Don't show password on edit
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
            const payload = { ...formData };
            if (isEditing && !payload.password) {
                delete payload.password;
            }

            if (isEditing) {
                await usersApi.updateUser(user._id, payload);
            } else {
                await usersApi.createUser(payload);
            }

            handleClose(true); // true means refresh needed
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.message || 'Server error while saving user');
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
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Assigned Branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        sx={inputStyles}
                    >
                        {branches.map((b) => (
                            <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                        ))}
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
