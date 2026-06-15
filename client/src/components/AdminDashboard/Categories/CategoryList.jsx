import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, DialogContentText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', taxRate: 0 });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpen = (category = null) => {
        if (category) {
            setIsEditing(true);
            setCurrentId(category._id);
            setFormData({ name: category.name, description: category.description || '', taxRate: category.taxRate || 0 });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({ name: '', description: '', taxRate: 0 });
        }
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = isEditing ? `http://localhost:5000/api/categories/${currentId}` : 'http://localhost:5000/api/categories';
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
                fetchCategories();
                handleClose();
                setSnackbar({ open: true, message: `Category ${isEditing ? 'updated' : 'added'} successfully!`, severity: 'success' });
            } else {
                const errorData = await res.json();
                setSnackbar({ open: true, message: errorData.message || 'Error saving category', severity: 'error' });
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
            const res = await fetch(`http://localhost:5000/api/categories/${currentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchCategories();
                setSnackbar({ open: true, message: 'Category deleted!', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
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

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b' }}>
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
                        {categories.map((cat) => (
                            <TableRow key={cat._id}>
                                <TableCell sx={{ color: '#fff' }}>{cat.name}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{cat.description}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{cat.taxRate}%</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(cat)} sx={{ color: '#60a5fa' }}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteClick(cat._id)} sx={{ color: '#ef4444' }}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleClose} PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', minWidth: '400px' } }}>
                <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                <DialogContent>
                    <TextField 
                        fullWidth margin="dense" label="Category Name" 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, mt: 2 }}
                    />
                    <TextField 
                        fullWidth margin="dense" label="Description" multiline rows={3}
                        value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                        sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, mt: 2 }}
                    />
                    <TextField 
                        fullWidth margin="dense" label="Tax Rate (%)" type="number"
                        value={formData.taxRate} onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})}
                        sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#3b82f6' }}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff' } }}>
                <DialogTitle>Delete Category?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>Are you sure? This cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CategoryList;
