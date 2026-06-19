import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AccountCircle as AccountIcon } from '@mui/icons-material';
import { reportsApi } from '../../../services/reportsApi';

const CustomerReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await reportsApi.getCustomerReport();
                if (data) setData(data);
            } catch (error) {
                console.error("Error fetching customer reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!data) return <Typography color="error">Failed to load customer data.</Typography>;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                <AccountIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Top Customers (By Revenue)</Typography>
            </Box>
            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8' }}>Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>Contact Info</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }} align="right">Total Purchases</TableCell>
                            <TableCell sx={{ color: '#94a3b8' }} align="right">Total Spent</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.topCustomers?.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell sx={{ color: '#fff' }}>{row.name}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>
                                    {row.email}<br />
                                    <Typography variant="caption" color="#64748b">{row.phone}</Typography>
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }} align="right">{row.totalPurchases}</TableCell>
                                <TableCell sx={{ color: '#3b82f6', fontWeight: 700 }} align="right">LKR {row.totalSpent.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CustomerReports;
