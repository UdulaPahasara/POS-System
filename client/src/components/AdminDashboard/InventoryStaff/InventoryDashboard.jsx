import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { AddShoppingCart, Receipt, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const [stats, setStats] = useState({ lowStock: 0, pendingPO: 0, incomingPO: 0 });
    const navigate = useNavigate();
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const roleName = user?.role?.roleName || user?.role || 'Inventory Staff';
    const basePath = roleName === 'Admin' ? '/admin' : roleName === 'Manager' ? '/manager' : '/inventory-staff';

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const pRes = await fetch('http://localhost:5000/api/products', { headers });
            const poRes = await fetch('http://localhost:5000/api/purchase-orders', { headers });
            
            if (pRes.ok && poRes.ok) {
                const products = await pRes.json();
                const pos = await poRes.json();
                
                const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;
                const pendingCount = pos.filter(po => po.status === 'Pending').length;
                const incomingCount = pos.filter(po => po.status === 'Approved').length;
                
                setStats({ lowStock: lowStockCount, pendingPO: pendingCount, incomingPO: incomingCount });
            }
        } catch (error) {
            console.error("Error fetching stats", error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#fff', mb: 4, fontWeight: 700 }}>
                Inventory Dashboard
            </Typography>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, bgcolor: '#1e293b', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Warning fontSize="large" />
                        <Box>
                            <Typography variant="h3">{stats.lowStock}</Typography>
                            <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Low Stock Alerts</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, bgcolor: '#1e293b', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AddShoppingCart fontSize="large" />
                        <Box>
                            <Typography variant="h3">{stats.pendingPO}</Typography>
                            <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Pending Approval</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, bgcolor: '#1e293b', color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Receipt fontSize="large" />
                        <Box>
                            <Typography variant="h3">{stats.incomingPO}</Typography>
                            <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Incoming Shipments</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Button 
                        fullWidth variant="contained" 
                        sx={{ py: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                        onClick={() => navigate(`${basePath}/purchase-orders`)}
                    >
                        Purchase Orders
                    </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Button 
                        fullWidth variant="outlined" 
                        sx={{ py: 2, color: '#94a3b8', borderColor: '#334155' }}
                        onClick={() => navigate(`${basePath}/inventory`)}
                    >
                        Update Stock
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InventoryDashboard;
