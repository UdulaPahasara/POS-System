import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { AttachMoney as MoneyIcon, TrendingUp as TrendingUpIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { reportsApi } from '../../../services/reportsApi';

const FinancialReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const data = await reportsApi.getFinancialReport();
                if (data) setData(data);
            } catch (error) {
                console.error("Error fetching financial reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!data) return <Typography color="error">Failed to load financial data.</Typography>;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>Financial Overview</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                            <MoneyIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Revenue</Typography>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>LKR {data.totalRevenue?.toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2 }}>
                            <WalletIcon sx={{ color: '#f59e0b', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Cost of Goods Sold (COGS)</Typography>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>LKR {data.totalCOGS?.toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                        animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
                        '@keyframes slideUp': {
                            '0%': { opacity: 0, transform: 'translateY(30px)' },
                            '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                    }}>
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
                            <TrendingUpIcon sx={{ color: '#10b981', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Gross Profit</Typography>
                            <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 700 }}>LKR {data.grossProfit?.toFixed(2)}</Typography>
                            <Typography variant="caption" sx={{ color: '#10b981' }}>{data.profitMargin}% Margin</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FinancialReports;
