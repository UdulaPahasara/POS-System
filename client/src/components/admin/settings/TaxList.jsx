import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, DialogContentText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNotifications } from '../../../context/NotificationContext';
import { taxesApi } from '../../../services/taxesApi';

const TaxList = () => {
    const [taxes, setTaxes] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ taxName: '', rate: 0 });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchTaxes = async () => {
        try {
            const data = await taxesApi.getAllTaxes();
            if (data) setTaxes(data);
        } catch (error) {
            console.error('Error fetching taxes:', error);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'TAX') {
                fetchTaxes();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const handleOpen = (tax = null) => {
        if (tax) {
            setIsEditing(true);
            setCurrentId(tax._id);
            setFormData({ taxName: tax.taxName, rate: tax.rate });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({ taxName: '', rate: 0 });
        }
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                await taxesApi.updateTax(currentId, formData);
            } else {
                await taxesApi.createTax(formData);
            }
            fetchTaxes();
            handleClose();
            setSnackbar({ open: true, message: `Tax rate ${isEditing ? 'updated' : 'added'} successfully!`, severity: 'success' });
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
            await taxesApi.deleteTax(currentId);
            fetchTaxes();
            setSnackbar({ open: true, message: 'Tax rate deleted!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Server error', severity: 'error' });
        }
        setDeleteDialogOpen(false);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Tax Rates</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ bgcolor: '#3b82f6' }}>
                    Add Tax Rate
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>Tax Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Rate (%)</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taxes.map((tax) => (
                            <TableRow key={tax._id}>
                                <TableCell sx={{ color: '#fff' }}>{tax.taxName}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{tax.rate}%</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(tax)} sx={{ color: '#60a5fa' }}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteClick(tax._id)} sx={{ color: '#ef4444' }}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleClose} PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', minWidth: '400px' } }}>
                <DialogTitle>{isEditing ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                <DialogContent>
                    <TextField 
                        fullWidth margin="dense" label="Tax Name (e.g. Standard VAT)" 
                        value={formData.taxName} onChange={(e) => setFormData({...formData, taxName: e.target.value})}
                        sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, mt: 2 }}
                    />
                    <TextField 
                        fullWidth margin="dense" label="Rate (%)" type="number"
                        value={formData.rate} onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
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
                <DialogTitle>Delete Tax Rate?</DialogTitle>
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

export default TaxList;
