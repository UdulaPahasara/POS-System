import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, CircularProgress,
    Button, Dialog, DialogContent, IconButton, Divider, Fade
} from '@mui/material';
import { Description as InvoiceIcon, ReceiptLong as ReceiptIcon, Close as CloseIcon } from '@mui/icons-material';
import { invoiceApi } from '../../../services/invoiceApi';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openReceipt, setOpenReceipt] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await invoiceApi.getAllInvoices();
            setInvoices(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch invoices. Ensure you have the proper permissions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = (invoice) => {
        setSelectedInvoice(invoice);
        setOpenReceipt(true);
    };

    const handleCloseReceipt = () => {
        setOpenReceipt(false);
        setTimeout(() => setSelectedInvoice(null), 300);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                <InvoiceIcon sx={{ color: '#8b5cf6', fontSize: 32 }} />
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>Invoices</Typography>
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
                            <TableCell sx={{ color: '#94a3b8' }}>Invoice Number</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Date</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Total Amount</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ color: '#94a3b8', py: 4 }}>No invoices found.</TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv, index) => (
                                <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={inv._id}>
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
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{new Date(inv.issueDate).toLocaleString()}</TableCell>
                                        <TableCell sx={{ color: '#8b5cf6', fontWeight: 700 }}>LKR {inv.total?.toFixed(2)}</TableCell>
                                        <TableCell align="right">
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                startIcon={<ReceiptIcon />}
                                                onClick={() => handleViewReceipt(inv)}
                                                sx={{ 
                                                    bgcolor: 'rgba(139, 92, 246, 0.1)', 
                                                    color: '#c4b5fd',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    borderRadius: 2,
                                                    textTransform: 'none',
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Receipt Modal */}
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
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.sale?.cashier?.username || 'Unknown'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Customer:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.sale?.customer?.name || 'Walk-in'}</Typography>
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
                            
                            {selectedInvoice.sale?.items?.map((item, index) => (
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
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.sale?.subtotal?.toFixed(2) || '0.00'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Tax:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>{selectedInvoice.sale?.tax?.toFixed(2) || '0.00'}</Typography>
                            </Box>
                            
                            {(selectedInvoice.sale?.items?.reduce((sum, item) => sum + ((item.sellingPrice * item.quantity) - item.subtotal), 0) > 0) && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Discount:</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
                                        -{selectedInvoice.sale?.items?.reduce((sum, item) => sum + ((item.sellingPrice * item.quantity) - item.subtotal), 0).toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                            
                            {selectedInvoice.sale?.pointsRedeemed > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Points Discount:</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>-{(selectedInvoice.sale?.subtotal + selectedInvoice.sale?.tax - selectedInvoice.sale?.total).toFixed(2)}</Typography>
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
                                Paid via: {selectedInvoice.sale?.payments?.[0]?.paymentMethod || 'Cash'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', mb: 0.5 }}>
                                Amount Tendered: {selectedInvoice.sale?.payments?.[0]?.amount?.toFixed(2) || selectedInvoice.total?.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
                                Change: {selectedInvoice.sale?.payments?.[0]?.change?.toFixed(2) || '0.00'}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>Thank You For Shopping!</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'inherit', display: 'block', mt: 1 }}>Please come again</Typography>
                        </Box>
                    </DialogContent>
                )}
            </Dialog>
        </Box>
    );
};

export default InvoiceList;
