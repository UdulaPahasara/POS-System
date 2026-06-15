import React, { useState, useEffect } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Typography, Chip, Box, Avatar
} from '@mui/material';
import { Inventory2 as InventoryIcon } from '@mui/icons-material';

const HistoryTable = () => {
    const [logs, setLogs] = useState([]);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/inventory/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching inventory logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionColor = (action) => {
        switch (action) {
            case 'Add': return 'success';
            case 'Subtract': return 'error';
            case 'Set': return 'info';
            default: return 'default';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }).format(date);
    };

    return (
        <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Date & Time</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Image</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Product</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Admin</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Action</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Qty Changed</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>New Stock</TableCell>
                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Reason</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <Avatar 
                                    src={log.product?.imageUrl ? `http://localhost:5000${log.product.imageUrl}` : undefined} 
                                    variant="rounded" 
                                    sx={{ width: 44, height: 44, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                >
                                    {(!log.product || !log.product.imageUrl) && <InventoryIcon />}
                                </Avatar>
                            </TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography variant="body2" fontWeight="600">{log.product?.name || 'Deleted Product'}</Typography>
                                <Typography variant="caption" color="#94a3b8">{log.product?.sku || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {log.adminUser?.username || 'Unknown User'}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <Chip label={log.action} size="small" color={getActionColor(log.action)} sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>
                                {log.action === 'Add' ? '+' : log.action === 'Subtract' ? '-' : ''}{log.quantityChanged}
                            </TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, color: '#60a5fa' }}>
                                {log.newStockLevel}
                            </TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', fontStyle: 'italic' }}>
                                {log.reason}
                            </TableCell>
                        </TableRow>
                    ))}
                    {logs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ color: '#94a3b8', borderBottom: 'none', py: 4 }}>
                                No inventory history available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default HistoryTable;
