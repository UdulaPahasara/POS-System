import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { reportsApi } from '../../../services/reportsApi';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesReports = ({ selectedBranchId }) => {
    const [interval, setInterval] = useState('daily');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            setLoading(true);
            try {
                const result = await reportsApi.getSalesReport({ interval, branchId: selectedBranchId });
                if (result) {
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching advanced sales", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, [interval, selectedBranchId]);

    const chartData = {
        labels: data.map(d => d._id),
        datasets: [
            {
                label: 'Revenue (LKR)',
                data: data.map(d => d.totalRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1,
            }
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: `${interval.charAt(0).toUpperCase() + interval.slice(1)} Sales Revenue`,
                color: '#fff'
            },
        },
        scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Sales Trends</Typography>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#94a3b8' }}>Interval</InputLabel>
                    <Select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        label="Interval"
                        sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
                <Paper sx={{ 
                    p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                    animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                    '@keyframes slideUp': {
                        '0%': { opacity: 0, transform: 'translateY(30px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                    }
                }}>
                    {data.length > 0 ? (
                        <Bar data={chartData} options={options} />
                    ) : (
                        <Typography sx={{ color: '#94a3b8', textAlign: 'center' }}>No sales data available for this interval.</Typography>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default SalesReports;
