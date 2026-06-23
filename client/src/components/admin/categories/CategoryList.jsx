import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, DialogContentText, Fade
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNotifications } from '../../../context/NotificationContext';
import { categoriesApi } from '../../../services/categoriesApi';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', taxRate: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAllCategories();
            if (data) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'CATEGORY') {
                fetchCategories();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const handleOpen = (category = null) => {
        if (category) {
            setIsEditing(true);
            setCurrentId(category._id);
            setFormData({ name: category.name, description: category.description || '', taxRate: category.taxRate !== undefined ? category.taxRate : '' });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({ name: '', description: '', taxRate: '' });
        }
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                await categoriesApi.updateCategory(currentId, formData);
            } else {
                await categoriesApi.createCategory(formData);
            }
            fetchCategories();
            handleClose();
            setSnackbar({ open: true, message: `Category ${isEditing ? 'updated' : 'added'} successfully!`, severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
    };

    const handleDeleteClick = (id) => {
        setCurrentId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await categoriesApi.deleteCategory(currentId);
            fetchCategories();
            setSnackbar({ open: true, message: 'Category deleted!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
        setDeleteDialogOpen(false);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Categories</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ bgcolor: '#3b82f6' }}>
                    Add Category
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ 
                bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Description</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Tax Rate (%)</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((cat, index) => (
                            <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={cat._id}>
                                <TableRow
                                    sx={{ 
                                        '&:hover': { 
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                            position: 'relative'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    <TableCell sx={{ color: '#fff' }}>{cat.name}</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>{cat.description}</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>{cat.taxRate}%</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(cat)} sx={{ color: '#60a5fa' }}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDeleteClick(cat._id)} sx={{ color: '#ef4444' }}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            </Fade>
                        ))}
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
                        minWidth: '400px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>
                    {isEditing ? 'Edit Category' : 'Add Category'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField 
                        fullWidth margin="dense" label="Category Name" 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        sx={inputStyles}
                    />
                    <TextField 
                        fullWidth margin="dense" label="Description" multiline rows={3}
                        value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                        sx={{ ...inputStyles, mt: 2 }}
                    />
                    <TextField 
                        fullWidth margin="dense" label="Tax Rate (%)" type="number"
                        value={formData.taxRate} onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                        sx={{ ...inputStyles, mt: 2 }}
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
                <DialogTitle>Delete Category?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>Are you sure? This cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>Delete</Button>
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

export default CategoryList;
