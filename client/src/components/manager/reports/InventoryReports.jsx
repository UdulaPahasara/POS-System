import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Inventory as InventoryIcon, Warning as WarningIcon } from '@mui/icons-material';
import { reportsApi } from '../../../services/reportsApi';

const InventoryReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await reportsApi.getInventoryReport();
                if (data) setData(data);
            } catch (error) {
                console.error("Error fetching inventory reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!data) return <Typography color="error">Failed to load inventory data.</Typography>;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>Inventory Overview</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Stock Value</Typography>
                        <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700 }}>LKR {data.totalStockValue?.toFixed(2)}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Products</Typography>
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{data.totalProducts}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Low Stock Items</Typography>
                        <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 700 }}>{data.lowStockCount}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Out of Stock</Typography>
                        <Typography variant="h5" sx={{ color: '#f59e0b', fontWeight: 700 }}>{data.outOfStockCount}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {data.lowStockItems?.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                        <WarningIcon sx={{ color: '#ef4444' }} />
                        <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600 }}>Low Stock Alerts</Typography>
                    </Box>
                    <TableContainer component={Paper} sx={{ 
                        bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)',
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: '#94a3b8' }}>Product</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }}>SKU</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Current Stock</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Reorder Level</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.lowStockItems.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell sx={{ color: '#fff' }}>{row.name}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{row.sku}</TableCell>
                                        <TableCell sx={{ color: '#ef4444', fontWeight: 700 }} align="right">{row.stock}</TableCell>
                                        <TableCell sx={{ color: '#94a3b8' }} align="right">{row.reorderLevel}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
};

export default InventoryReports;
