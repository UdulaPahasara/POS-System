import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress } from '@mui/material';
import { 
    Assessment as AssessmentIcon,
    Inventory as InventoryIcon,
    AttachMoney as MoneyIcon,
    Print as PrintIcon
} from '@mui/icons-material';

const ReportLayout = () => {
    const [salesReport, setSalesReport] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                const [salesRes, invRes] = await Promise.all([
                    fetch('http://localhost:5000/api/reports/sales', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/reports/inventory', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (salesRes.ok && invRes.ok) {
                    setSalesReport(await salesRes.json());
                    setInventoryReport(await invRes.json());
                }
            } catch (error) {
                console.error("Error fetching reports", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Business Reports</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Generate and view your store's analytics.</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                    Export / Print
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* Sales Summary */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                            <MoneyIcon sx={{ color: '#10b981' }} />
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Sales Summary</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Total Revenue</Typography>
                                <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 700 }}>
                                    LKR {salesReport?.totalRevenue?.toFixed(2) || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Total Tax Collected</Typography>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                                    LKR {salesReport?.totalTax?.toFixed(2) || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Total Sales Count</Typography>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                                    {salesReport?.totalSales || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Items Sold</Typography>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                                    {salesReport?.totalItemsSold || 0}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Inventory Summary */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                            <InventoryIcon sx={{ color: '#8b5cf6' }} />
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Inventory Status</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Total Stock Value</Typography>
                                <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700 }}>
                                    LKR {inventoryReport?.totalStockValue?.toFixed(2) || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#94a3b8">Total Product Lines</Typography>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                                    {inventoryReport?.totalProducts || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#ef4444">Low Stock Items</Typography>
                                <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 700 }}>
                                    {inventoryReport?.lowStockCount || 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="#f59e0b">Out of Stock</Typography>
                                <Typography variant="h5" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                                    {inventoryReport?.outOfStockCount || 0}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Low Stock Detailed List */}
                {inventoryReport?.lowStockItems?.length > 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600, mb: 2 }}>Low Stock Alerts</Typography>
                            {inventoryReport.lowStockItems.map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5 }}>
                                    <Box>
                                        <Typography sx={{ color: '#fff', fontWeight: 500 }}>{item.name}</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>SKU: {item.sku}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography sx={{ color: '#ef4444', fontWeight: 700 }}>{item.stock} left</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Reorder at {item.reorderLevel}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default ReportLayout;
