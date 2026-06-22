import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, CircularProgress,
    Button
} from '@mui/material';
import { Description as InvoiceIcon } from '@mui/icons-material';
import { invoiceApi } from '../../../services/invoiceApi';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            <TableCell sx={{ color: '#94a3b8' }}>Cashier</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Customer</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Items</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8' }}>Total Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8', py: 4 }}>No invoices found.</TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow 
                                    key={inv._id}
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
                                    <TableCell sx={{ color: '#fff' }}>{inv.sale?.cashier?.name || 'Unknown'}</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>{inv.sale?.customer?.name || 'Walk-in Customer'}</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>{inv.sale?.items?.length || 0} items</TableCell>
                                    <TableCell align="right" sx={{ color: '#8b5cf6', fontWeight: 700 }}>LKR {inv.total?.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InvoiceList;
