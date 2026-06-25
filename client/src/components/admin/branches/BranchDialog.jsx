import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Typography, Box 
} from '@mui/material';
import { branchesApi } from '../../../services/branchesApi';

const BranchDialog = ({ open, handleClose, branch, isEditing }) => {
    const defaultForm = {
        name: '', address: '', phone: '', email: '', status: 'Active'
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        if (open) {
            if (isEditing && branch) {
                setFormData(branch);
            } else {
                setFormData(defaultForm);
            }
        }
    }, [open, isEditing, branch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert('Branch Name is required.');
            return;
        }

        try {
            if (isEditing) {
                await branchesApi.updateBranch(branch._id, formData);
            } else {
                await branchesApi.createBranch(formData);
            }
            handleClose(true);
        } catch (error) {
            console.error('Error saving branch:', error);
            alert(error.response?.data?.message || error.message || 'Server error while saving branch');
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
                {isEditing ? 'Edit Branch' : 'Add New Branch'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Branch Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        sx={inputStyles}
                    />
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
                    </TextField>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        sx={inputStyles}
                        multiline
                        rows={2}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
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
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Button onClick={() => handleClose(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>
                    {isEditing ? 'Save Changes' : 'Create Branch'}
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

export default BranchDialog;
