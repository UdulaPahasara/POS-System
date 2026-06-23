import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button, Fade } from '@mui/material';
import { AddShoppingCart, Receipt, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { productsApi } from '../../../services/productsApi';
import { purchasingApi } from '../../../services/purchasingApi';

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

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (['PRODUCT', 'PURCHASE_ORDER', 'PURCHASE_RETURN'].includes(data.type)) {
                fetchStats();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const fetchStats = async () => {
        try {
            const [products, pos] = await Promise.all([
                productsApi.getAllProducts(),
                purchasingApi.getPurchaseOrders()
            ]);
            
            if (products && pos) {
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
        <Box sx={{ 
            p: 3,
            animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
            '@keyframes slideUp': {
                '0%': { opacity: 0, transform: 'translateY(30px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
            }
        }}>
            <Typography variant="h4" sx={{ color: '#fff', mb: 4, fontWeight: 700 }}>
                Inventory Dashboard
            </Typography>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '0ms' }}>
                        <Paper sx={{ 
                            p: 3, bgcolor: '#1e293b', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 2,
                            borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        }}>
                            <Warning fontSize="large" />
                            <Box>
                                <Typography variant="h3">{stats.lowStock}</Typography>
                                <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Low Stock Alerts</Typography>
                            </Box>
                        </Paper>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '150ms' }}>
                        <Paper sx={{ 
                            p: 3, bgcolor: '#1e293b', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 2,
                            borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        }}>
                            <AddShoppingCart fontSize="large" />
                            <Box>
                                <Typography variant="h3">{stats.pendingPO}</Typography>
                                <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Pending Approval</Typography>
                            </Box>
                        </Paper>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '300ms' }}>
                        <Paper sx={{ 
                            p: 3, bgcolor: '#1e293b', color: '#10b981', display: 'flex', alignItems: 'center', gap: 2,
                            borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        }}>
                            <Receipt fontSize="large" />
                            <Box>
                                <Typography variant="h3">{stats.incomingPO}</Typography>
                                <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Incoming Shipments</Typography>
                            </Box>
                        </Paper>
                    </Fade>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '450ms' }}>
                        <Button 
                            fullWidth variant="contained" 
                            sx={{ 
                                py: 2, bgcolor: '#3b82f6', borderRadius: 2,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-2px)', boxShadow: '0 8px 25px -5px rgba(59,130,246,0.5)' }
                            }}
                            onClick={() => navigate(`${basePath}/purchase-orders`)}
                        >
                            Purchase Orders
                        </Button>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '600ms' }}>
                        <Button 
                            fullWidth variant="outlined" 
                            sx={{ 
                                py: 2, color: '#94a3b8', borderColor: '#334155', borderRadius: 2,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': { borderColor: '#64748b', bgcolor: 'rgba(255,255,255,0.02)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)' }
                            }}
                            onClick={() => navigate(`${basePath}/inventory`)}
                        >
                            Update Stock
                        </Button>
                    </Fade>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InventoryDashboard;
