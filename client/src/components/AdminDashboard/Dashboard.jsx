import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
    AttachMoney as RevenueIcon, 
    ShoppingCart as SalesIcon, 
    TrendingUp as ProfitIcon,
    Inventory as StockIcon
} from '@mui/icons-material';

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SummaryCard = ({ title, value, subtitle, icon, color }) => (
    <Paper 
        sx={{ 
            p: 3, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0, flex: 1, pr: 1 }}>
            <Typography variant="body2" noWrap sx={{ color: '#94a3b8', mb: 1, fontWeight: 500 }}>{title}</Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', lg: '2rem' }, wordBreak: 'break-word' }}>{value}</Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'block' }}>{subtitle}</Typography>
        </Box>
        <Box 
            sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: `${color}20`,
                color: color
            }}
        >
            {icon}
        </Box>
    </Paper>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get user role
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRoleObj = user?.role;
    const userRole = typeof userRoleObj === 'object' ? userRoleObj?.roleName : (userRoleObj || 'Admin');

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/reports/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError("Failed to load dashboard data.");
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    if (loading) return <Box sx={{ p: 4 }}><Typography sx={{ color: '#fff' }}>Loading Dashboard...</Typography></Box>;
    if (error) return <Box sx={{ p: 4 }}><Typography sx={{ color: '#ef4444' }}>{error}</Typography></Box>;

    // Chart Data
    const chartData = {
        labels: stats?.chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                fill: true,
                label: 'Revenue (Rs.)',
                data: stats?.chartData?.data || [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
    };

    const recentTransactions = stats?.recentTransactions || [];
    const lowStockItems = stats?.lowStockItems || [];

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Dashboard Overview</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Here's what's happening with your store today.</Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
                <Grid item xs={11} sm={5} md={3}>
                    <SummaryCard title="Today's Sales" value={`Rs.${stats?.todayRevenue?.toLocaleString() || 0}`} subtitle="Calculated from today's orders" icon={<SalesIcon fontSize="large" />} color="#3b82f6" />
                </Grid>
                {userRole === 'Admin' && (
                    <Grid item xs={11} sm={5} md={3}>
                        <SummaryCard title="Monthly Revenue" value={`Rs.${stats?.monthlyRevenue?.toLocaleString() || 0}`} subtitle="Total revenue for this month" icon={<RevenueIcon fontSize="large" />} color="#10b981" />
                    </Grid>
                )}
                {userRole === 'Admin' && (
                    <Grid item xs={11} sm={5} md={3}>
                        <SummaryCard title="Total Profit" value={`Rs.${stats?.totalProfit?.toLocaleString() || 0}`} subtitle="Gross profit this month" icon={<ProfitIcon fontSize="large" />} color="#f59e0b" />
                    </Grid>
                )}
                <Grid item xs={11} sm={5} md={3}>
                    <SummaryCard title="Items in Stock" value={(stats?.itemsInStock || 0).toLocaleString()} subtitle={`${stats?.lowStockItems?.length || 0} items running low`} icon={<StockIcon fontSize="large" />} color="#8b5cf6" />
                </Grid>
            </Grid>

            {/* Main Chart - Admin Only */}
            {userRole === 'Admin' && (
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', mb: 4 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>Revenue Trend (Last 7 Days)</Typography>
                    <Box sx={{ height: 300 }}>
                        <Line data={chartData} options={chartOptions} />
                    </Box>
                </Paper>
            )}

            {/* Data Tables */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={7} sx={{ display: 'flex' }}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', height: '100%', width: '100%', flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>Recent Transactions</Typography>
                        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table sx={{ width: '100%', minWidth: 600, tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Invoice</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Customer</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentTransactions.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.id}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.customer}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>{row.amount}</TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Chip 
                                                    label={row.status} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: row.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                        color: row.status === 'Completed' ? '#10b981' : '#f59e0b',
                                                        fontWeight: 600
                                                    }} 
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={5} sx={{ display: 'flex' }}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', height: '100%', width: '100%', flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>Low Stock Alerts</Typography>
                        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table sx={{ width: '100%', minWidth: 500, tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Product</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }} align="center">Stock</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }} align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lowStockItems.map((row) => (
                                        <TableRow key={row.sku}>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{row.sku}</Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 700 }}>
                                                {row.stock} / {row.reorder}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Button size="small" variant="outlined" sx={{ borderColor: '#3b82f6', color: '#3b82f6', textTransform: 'none' }}>
                                                    Reorder
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
