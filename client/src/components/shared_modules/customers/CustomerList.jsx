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
    Chip,
    Fade
} from '@mui/material';
import { 
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import CustomerDialog from './CustomerDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { customersApi } from '../../../services/customersApi';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [historyCustomer, setHistoryCustomer] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

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

    const handleOpenHistory = async (customer) => {
        setHistoryCustomer(customer);
        setHistoryDialogOpen(true);
        setHistoryLoading(true);
        try {
            const data = await customersApi.getCustomerHistory(customer._id);
            setHistoryData(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('Failed to load customer history');
        } finally {
            setHistoryLoading(false);
        }
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

            <Paper sx={{ 
                p: 3, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)',
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
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
                                    <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Redeemed Points</TableCell>
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
                                    customers.map((customer, index) => (
                                        <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={customer._id}>
                                        <TableRow 
                                            sx={{ 
                                                '&:last-child td, &:last-child th': { border: 0 },
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
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.name}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.phone}</TableCell>
                                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{customer.email || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Chip 
                                                    label={customer.loyaltyPoints || 0} 
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Chip 
                                                    label={customer.totalRedeemedPoints || 0} 
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <IconButton onClick={() => handleOpenHistory(customer)} sx={{ color: '#10b981', mr: 1 }} title="View Purchasing History">
                                                    <HistoryIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton onClick={() => openEditDialog(customer)} sx={{ color: '#3b82f6', mr: 1 }} title="Edit Customer">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(customer._id)} sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                        </Fade>
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

            {/* Purchasing History Modal */}
            <CustomerHistoryDialog 
                open={historyDialogOpen}
                handleClose={() => setHistoryDialogOpen(false)}
                customer={historyCustomer}
                data={historyData}
                loading={historyLoading}
            />
        </Box>
    );
};

// Extracted History Dialog Component
import { Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import { ReceiptLong as ReceiptIcon } from '@mui/icons-material';

const CustomerHistoryDialog = ({ open, handleClose, customer, data, loading }) => {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openReceipt, setOpenReceipt] = useState(false);

    const handleViewReceipt = (sale) => {
        setSelectedInvoice(sale);
        setOpenReceipt(true);
    };

    const handleCloseReceipt = () => {
        setOpenReceipt(false);
        setTimeout(() => setSelectedInvoice(null), 300);
    };

    return (
        <>
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', color: '#0f172a' }}>
                <Typography variant="h6" fontWeight="bold">
                    Purchasing History - {customer?.name}
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: '#64748b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                ) : data.length === 0 ? (
                    <Typography color="#64748b" textAlign="center" py={5}>No purchases found for this customer.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>Invoice No</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>Total Amount</TableCell>
                                    <TableCell align="right" sx={{ color: '#64748b', fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((sale, index) => (
                                    <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={sale._id}>
                                    <TableRow sx={{ 
                                        '&:last-child td, &:last-child th': { border: 0 }, 
                                        '&:hover': { 
                                            bgcolor: '#f1f5f9',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                            position: 'relative'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}>
                                        <TableCell sx={{ color: '#0f172a', borderBottomColor: '#e2e8f0', fontWeight: 500 }}>{sale.invoiceNumber}</TableCell>
                                        <TableCell sx={{ color: '#0f172a', borderBottomColor: '#e2e8f0' }}>{new Date(sale.issueDate).toLocaleDateString()}</TableCell>
                                        <TableCell sx={{ color: '#10b981', fontWeight: 800, borderBottomColor: '#e2e8f0' }}>
                                            LKR {sale.total?.toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottomColor: '#e2e8f0' }}>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                startIcon={<ReceiptIcon />}
                                                onClick={() => handleViewReceipt(sale)}
                                                sx={{ 
                                                    bgcolor: 'rgba(139, 92, 246, 0.1)', 
                                                    color: '#8b5cf6',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        bgcolor: '#8b5cf6',
                                                        color: '#fff',
                                                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                                                        transform: 'translateY(-1px)'
                                                    },
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    </Fade>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>

        {/* Receipt Modal (Matches Invoices Module) */}
        <Dialog 
            open={openReceipt} 
            onClose={handleCloseReceipt}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#f8fafc',
                    color: '#0f172a',
                    borderRadius: 0,
                    fontFamily: '"Courier New", Courier, monospace',
                    position: 'relative',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }
            }}
        >
            <IconButton
                onClick={handleCloseReceipt}
                sx={{ position: 'absolute', right: 8, top: 8, color: '#64748b' }}
            >
                <CloseIcon />
            </IconButton>
            
            {selectedInvoice && (
                <DialogContent sx={{ p: 4, pt: 5 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'inherit', letterSpacing: 1 }}>POINT OF SALE</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#64748b' }}>123 Main Street, Colombo</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#64748b' }}>Tel: +94 112 345 678</Typography>
                    </Box>
                    
                    <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                    {/* Meta Data */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Receipt No:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 600 }}>{selectedInvoice.invoiceNumber}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Date:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{new Date(selectedInvoice.issueDate).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Cashier:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.cashier?.username || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Customer:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.customer?.name || customer?.name}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                    {/* Itemized List */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 700 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '40%' }}>Item</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '20%', textAlign: 'center' }}>Qty</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '40%', textAlign: 'right' }}>Amount</Typography>
                        </Box>
                        
                        {selectedInvoice.items?.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit', width: '40%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.name || 'Unknown Item'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit', width: '20%', textAlign: 'center' }}>
                                    {item.quantity}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit', width: '40%', textAlign: 'right' }}>
                                    {(item.subtotal || 0).toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                    {/* Summary */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Subtotal:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.subtotal?.toFixed(2) || '0.00'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Tax:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.tax?.toFixed(2) || '0.00'}</Typography>
                        </Box>
                        
                        {(selectedInvoice.items?.reduce((sum, item) => sum + ((item.sellingPrice * item.quantity) - item.subtotal), 0) > 0) && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Discount:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
                                    -{selectedInvoice.items?.reduce((sum, item) => sum + ((item.sellingPrice * item.quantity) - item.subtotal), 0).toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                        
                        {selectedInvoice.pointsRedeemed > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Points Discount:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>-{(selectedInvoice.subtotal + selectedInvoice.tax - selectedInvoice.total).toFixed(2)}</Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #0f172a' }}>
                            <Typography variant="h6" sx={{ fontFamily: 'inherit', fontWeight: 800 }}>TOTAL:</Typography>
                            <Typography variant="h6" sx={{ fontFamily: 'inherit', fontWeight: 800 }}>LKR {selectedInvoice.total?.toFixed(2)}</Typography>
                        </Box>
                    </Box>
                    
                    <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                    {/* Payment Info */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit', mb: 0.5 }}>
                            Paid via: {selectedInvoice.payments?.[0]?.paymentMethod || 'Cash'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit', mb: 0.5 }}>
                            Amount Tendered: {selectedInvoice.payments?.[0]?.amount?.toFixed(2) || selectedInvoice.total?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
                            Change: {selectedInvoice.payments?.[0]?.change?.toFixed(2) || '0.00'}
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>Thank You For Shopping!</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'inherit', display: 'block', mt: 1 }}>Please come again</Typography>
                    </Box>
                </DialogContent>
            )}
        </Dialog>
        </>
    );
};

export default CustomerList;
