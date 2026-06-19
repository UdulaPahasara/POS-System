import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    IconButton,
    CircularProgress,
    Chip
} from '@mui/material';
import { 
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import CustomerDialog from './CustomerDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { customersApi } from '../../../services/customersApi';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await customersApi.getAllCustomers();
            if (data) setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'CUSTOMER') {
                fetchCustomers();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        
        try {
            await customersApi.deleteCustomer(id);
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(error.message || 'Error deleting customer');
        }
    };

    const openAddDialog = () => {
        setSelectedCustomer(null);
        setDialogOpen(true);
    };

    const openEditDialog = (customer) => {
        setSelectedCustomer(customer);
        setDialogOpen(true);
    };

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Customers</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Manage your customer database and loyalty points.</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={openAddDialog}
                    sx={{ bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                    Add Customer
                </Button>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Name</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Phone</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Loyalty Points</TableCell>
                                    <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', py: 4, borderBottom: 'none' }}>
                                            No customers found. Add your first customer!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.name}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.phone}</TableCell>
                                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.email || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Chip 
                                                    label={customer.loyaltyPoints} 
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <IconButton onClick={() => openEditDialog(customer)} sx={{ color: '#3b82f6', mr: 1 }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(customer._id)} sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <CustomerDialog 
                open={dialogOpen} 
                handleClose={() => setDialogOpen(false)} 
                customer={selectedCustomer}
                refreshCustomers={fetchCustomers}
            />
        </Box>
    );
};

export default CustomerList;
