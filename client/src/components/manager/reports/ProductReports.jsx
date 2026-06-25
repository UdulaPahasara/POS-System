import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { reportsApi } from '../../../services/reportsApi';

const ProductReports = ({ selectedBranchId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await reportsApi.getProductReport({ branchId: selectedBranchId });
                if (data) setData(data);
            } catch (error) {
                console.error("Error fetching product reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [selectedBranchId]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!data) return <Typography color="error">Failed to load product data.</Typography>;

    return (
        <Box>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600, mb: 2 }}>Top Selling Products</Typography>
                    <TableContainer component={Paper} sx={{ 
                        bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)',
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: '#94a3b8' }}>Product</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Qty Sold</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Revenue</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.topSelling?.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell sx={{ color: '#fff' }}>{row.name}<br/><Typography variant="caption" color="#64748b">{row.sku}</Typography></TableCell>
                                        <TableCell sx={{ color: '#fff' }} align="right">{row.quantitySold}</TableCell>
                                        <TableCell sx={{ color: '#10b981' }} align="right">LKR {row.revenueGenerated.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600, mb: 2 }}>Slow Moving Products</Typography>
                    <TableContainer component={Paper} sx={{ 
                        bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)',
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: '#94a3b8' }}>Product</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Qty Sold</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }} align="right">Revenue</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.slowMoving?.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell sx={{ color: '#fff' }}>{row.name}<br/><Typography variant="caption" color="#64748b">{row.sku}</Typography></TableCell>
                                        <TableCell sx={{ color: '#fff' }} align="right">{row.quantitySold}</TableCell>
                                        <TableCell sx={{ color: '#ef4444' }} align="right">LKR {row.revenueGenerated.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductReports;
