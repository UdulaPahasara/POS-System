import React from 'react';
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
    // Get user role
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'Admin';

    // Chart Data
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                fill: true,
                label: 'Revenue (Rs.)',
                data: [1200, 1900, 1500, 2200, 1800, 2800, 2400],
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

    // Mock Data Tables
    const recentTransactions = [
        { id: 'INV-1001', customer: 'John Doe', amount: 'Rs. 120.00', status: 'Completed' },
        { id: 'INV-1002', customer: 'Walk-in Customer', amount: 'Rs. 45.50', status: 'Completed' },
        { id: 'INV-1003', customer: 'Jane Smith', amount: 'Rs. 310.00', status: 'Pending' },
        { id: 'INV-1004', customer: 'Michael Brown', amount: 'Rs. 85.00', status: 'Completed' },
    ];

    const lowStockItems = [
        { name: 'DJI Mini 3 Pro Battery', sku: 'DJI-B-001', stock: 2, reorder: 10 },
        { name: 'Sony A7IV Body', sku: 'SNY-C-042', stock: 1, reorder: 5 },
        { name: 'SanDisk 128GB SD Card', sku: 'SD-128-PRO', stock: 4, reorder: 20 },
    ];

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Dashboard Overview</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Here's what's happening with your store today.</Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
                <Grid item xs={11} sm={5} md={3}>
                    <SummaryCard title="Today's Sales" value="Rs.2,450" subtitle="+12% from yesterday" icon={<SalesIcon fontSize="large" />} color="#3b82f6" />
                </Grid>
                {userRole === 'Admin' && (
                    <Grid item xs={11} sm={5} md={3}>
                        <SummaryCard title="Monthly Revenue" value="Rs.45,230" subtitle="+5% from last month" icon={<RevenueIcon fontSize="large" />} color="#10b981" />
                    </Grid>
                )}
                {userRole === 'Admin' && (
                    <Grid item xs={11} sm={5} md={3}>
                        <SummaryCard title="Total Profit" value="Rs.18,400" subtitle="+8% from last month" icon={<ProfitIcon fontSize="large" />} color="#f59e0b" />
                    </Grid>
                )}
                <Grid item xs={11} sm={5} md={3}>
                    <SummaryCard title="Items in Stock" value="1,245" subtitle="12 items running low" icon={<StockIcon fontSize="large" />} color="#8b5cf6" />
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
                                                {row.stock}
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
