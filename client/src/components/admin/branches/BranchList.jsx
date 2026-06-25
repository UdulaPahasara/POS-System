import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions, Fade
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Store as StoreIcon
} from '@mui/icons-material';
import BranchDialog from './BranchDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { branchesApi } from '../../../services/branchesApi';

const BranchList = () => {
    const [branches, setBranches] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    
    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState(null);
    
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchBranches = async () => {
        try {
            const data = await branchesApi.getAllBranches();
            if (data) setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'BRANCH') {
                fetchBranches();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const handleOpenAdd = () => {
        setIsEditing(false);
        setSelectedBranch(null);
        setDialogOpen(true);
    };

    const handleOpenEdit = (branch) => {
        setIsEditing(true);
        setSelectedBranch(branch);
        setDialogOpen(true);
    };

    const handleCloseDialog = (refresh = false) => {
        setDialogOpen(false);
        setSelectedBranch(null);
        if (refresh) {
            fetchBranches();
            setSnackbar({ 
                open: true, 
                message: isEditing ? 'Branch updated successfully!' : 'Branch added successfully!', 
                severity: 'success' 
            });
        }
    };

    const handleOpenDelete = (id) => {
        setBranchToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await branchesApi.deleteBranch(branchToDelete);
            fetchBranches();
            setSnackbar({ open: true, message: 'Branch deleted successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error deleting branch:', error);
            setSnackbar({ open: true, message: error.response?.data?.message || error.message || 'Server error', severity: 'error' });
        }
        setDeleteDialogOpen(false);
        setBranchToDelete(null);
    };

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mb: 3 
            }}>
                <Typography 
                    variant="h4" 
                    sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                >
                    Branch Management
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleOpenAdd}
                    sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none', borderRadius: 2 }}
                >
                    Add Branch
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
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Branch Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Address</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contact</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {branches.map((branch, index) => (
                            <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 100}ms` }} key={branch._id}>
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
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        width: 40, height: 40, borderRadius: 2, 
                                        bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <StoreIcon />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{branch.name}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>{branch.address || 'N/A'}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{branch.phone || 'N/A'}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{branch.email || 'N/A'}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip 
                                        label={branch.status} 
                                        size="small" 
                                        color={branch.status === 'Active' ? 'success' : 'warning'} 
                                        sx={{ borderRadius: 1 }}
                                    />
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <IconButton onClick={() => handleOpenEdit(branch)} sx={{ color: '#60a5fa' }} size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                        onClick={() => handleOpenDelete(branch._id)} 
                                        sx={{ color: '#ef4444' }} 
                                        size="small"
                                        disabled={branch.name === 'Main Branch'}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                                </TableRow>
                            </Fade>
                        ))}
                        {branches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', borderBottom: 'none', py: 4 }}>
                                    No branches found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <BranchDialog 
                open={dialogOpen} 
                handleClose={handleCloseDialog}
                branch={selectedBranch}
                isEditing={isEditing}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: { xs: '90%', sm: '400px' },
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Branch</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        Are you sure you want to permanently delete this branch? This might affect employees or inventory tied to it.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={confirmDelete} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchList;
