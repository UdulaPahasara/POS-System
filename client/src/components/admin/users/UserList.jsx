import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions, Avatar, Badge, Fade
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import UserDialog from './UserDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { usersApi } from '../../../services/usersApi';
import { branchesApi } from '../../../services/branchesApi';
import { TextField, MenuItem } from '@mui/material';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
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
            const data = await usersApi.getAllUsers(selectedBranchId);
            if (data) setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchesApi.getAllBranches();
                if (data) {
                    setBranches(data);
                    setSelectedBranchId('global');
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [selectedBranchId]);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'USER') {
                fetchUsers();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

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
            await usersApi.deleteUser(userToDelete);
            fetchUsers();
            setSnackbar({ open: true, message: 'Employee deleted successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error deleting employee:', error);
            setSnackbar({ open: true, message: error.message || 'Server error deleting employee', severity: 'error' });
        }
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const getRoleColor = (role) => {
        const roleName = typeof role === 'object' ? role?.roleName : role;
        switch(roleName) {
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
                    Employee Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        select
                        size="small"
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        sx={{
                            minWidth: '200px',
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { border: '1px solid rgba(255,255,255,0.2)' },
                            },
                            '& .MuiSelect-icon': { color: '#94a3b8' }
                        }}
                    >
                        <MenuItem value="global">All Branches / Global</MenuItem>
                        {branches.map(b => (
                            <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                        ))}
                    </TextField>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenAdd}
                        sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none', borderRadius: 2 }}
                    >
                        Add Employee
                    </Button>
                </Box>
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
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Employee</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contact</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Branch</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user, index) => (
                            <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={user._id}>
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
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        variant="dot"
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                backgroundColor: user.status === 'Active' ? '#10b981' : (user.status === 'Suspended' ? '#ef4444' : '#f59e0b'),
                                                color: user.status === 'Active' ? '#10b981' : (user.status === 'Suspended' ? '#ef4444' : '#f59e0b'),
                                                boxShadow: '0 0 0 2px #1e293b',
                                            }
                                        }}
                                    >
                                        <Avatar 
                                            sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                            src={user.profilePic ? `http://localhost:5000${user.profilePic}` : ''}
                                        >
                                            {!user.profilePic && <PersonIcon />}
                                        </Avatar>
                                    </Badge>
                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{user.username}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{user.email}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{user.phone || 'No phone'}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip label={typeof user.role === 'object' ? user.role?.roleName : user.role} size="small" color={getRoleColor(user.role)} variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{user.branch ? user.branch.name : 'Unassigned'}</Typography>
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
                            </Fade>
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
