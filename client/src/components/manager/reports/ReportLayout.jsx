import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

import SalesReports from './SalesReports';
import InventoryReports from './InventoryReports';
import FinancialReports from './FinancialReports';
import ProductReports from './ProductReports';
import CustomerReports from './CustomerReports';
import { branchesApi } from '../../../services/branchesApi';
import { TextField, MenuItem } from '@mui/material';

const ReportLayout = () => {
    const location = useLocation();
    const [tabIndex, setTabIndex] = useState(location.state?.tabIndex !== undefined ? location.state.tabIndex : 0);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role?.roleName === 'Admin' || user?.role === 'Admin' || user?.role?.roleName === 'Super Admin';

    useEffect(() => {
        if (isAdmin) {
            const fetchBranches = async () => {
                try {
                    const data = await branchesApi.getAllBranches();
                    if (data && data.length > 0) {
                        setBranches(data);
                        setSelectedBranchId('global');
                    }
                } catch (error) {
                    console.error('Error fetching branches:', error);
                }
            };
            fetchBranches();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (location.state?.tabIndex !== undefined) {
            setTabIndex(location.state.tabIndex);
            // Clear the state so it doesn't get stuck if they refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state?.tabIndex]);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Business Reports</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Analyze your sales, inventory, and financial health.</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isAdmin && (
                        <TextField
                            select
                            size="small"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            sx={{
                                width: '250px',
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
                                    '&:hover fieldset': { border: '1px solid rgba(255,255,255,0.2)' },
                                },
                                '& .MuiSelect-icon': { color: '#94a3b8' }
                            }}
                        >
                            <MenuItem value="global">All Branches / Global</MenuItem>
                            {branches.map(b => (
                                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#3b82f6', '&:hover': { color: '#2563eb' } }} onClick={handlePrint}>
                        <PrintIcon sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Export / Print</Typography>
                    </Box>
                </Box>
            </Box>

            <Paper sx={{ bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, mb: 4 }}>
                <Tabs 
                    value={tabIndex} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'rgba(255,255,255,0.1)',
                        '& .MuiTab-root': { color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
                        '& .Mui-selected': { color: '#3b82f6 !important' },
                        '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
                    }}
                >
                    <Tab label="Sales" />
                    <Tab label="Financial" />
                    <Tab label="Products" />
                    <Tab label="Customers" />
                    <Tab label="Inventory" />
                </Tabs>
            </Paper>

            <Box sx={{ pb: 4 }}>
                {tabIndex === 0 && <SalesReports selectedBranchId={selectedBranchId} />}
                {tabIndex === 1 && <FinancialReports selectedBranchId={selectedBranchId} />}
                {tabIndex === 2 && <ProductReports selectedBranchId={selectedBranchId} />}
                {tabIndex === 3 && <CustomerReports selectedBranchId={selectedBranchId} />}
                {tabIndex === 4 && <InventoryReports selectedBranchId={selectedBranchId} />}
            </Box>
        </Box>
    );
};

export default ReportLayout;
