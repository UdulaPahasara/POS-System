import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions, Avatar
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import UserDialog from './UserDialog';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    
    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenAdd = () => {
        setIsEditing(false);
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleOpenEdit = (user) => {
        setIsEditing(true);
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleCloseDialog = (refresh = false) => {
        setDialogOpen(false);
        setSelectedUser(null);
        if (refresh) {
            fetchUsers();
            setSnackbar({ 
                open: true, 
                message: isEditing ? 'Employee updated successfully!' : 'Employee added successfully!', 
                severity: 'success' 
            });
        }
    };

    const handleOpenDelete = (id) => {
        setUserToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${userToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchUsers();
                setSnackbar({ open: true, message: 'Employee deleted successfully!', severity: 'success' });
            } else {
                const resData = await response.json();
                setSnackbar({ open: true, message: resData.message || 'Failed to delete employee', severity: 'error' });
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            setSnackbar({ open: true, message: 'Server error deleting employee', severity: 'error' });
        }
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const getRoleColor = (role) => {
        switch(role) {
            case 'Admin': return 'error';
            case 'Manager': return 'secondary';
            case 'Inventory Staff': return 'info';
            case 'Cashier': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Active': return 'success';
            case 'Inactive': return 'warning';
            case 'Suspended': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Employee Management</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleOpenAdd}
                    sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none', borderRadius: 2 }}
                >
                    Add Employee
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Employee</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contact</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                        <PersonIcon />
                                    </Avatar>
                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{user.username}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{user.email}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{user.phone || 'No phone'}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip label={user.role} size="small" color={getRoleColor(user.role)} variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip label={user.status} size="small" color={getStatusColor(user.status)} />
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <IconButton onClick={() => handleOpenEdit(user)} sx={{ color: '#60a5fa' }} size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => handleOpenDelete(user._id)} sx={{ color: '#ef4444' }} size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', borderBottom: 'none', py: 4 }}>
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <UserDialog 
                open={dialogOpen} 
                handleClose={handleCloseDialog}
                user={selectedUser}
                isEditing={isEditing}
            />

            {/* Delete Confirmation Dialog */}
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
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Employee</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        Are you sure you want to permanently delete this employee account?
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

export default UserList;
