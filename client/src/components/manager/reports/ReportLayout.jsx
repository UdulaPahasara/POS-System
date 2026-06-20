import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

import SalesReports from './SalesReports';
import InventoryReports from './InventoryReports';
import FinancialReports from './FinancialReports';
import ProductReports from './ProductReports';
import CustomerReports from './CustomerReports';

const ReportLayout = () => {
    const [tabIndex, setTabIndex] = useState(0);

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
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#3b82f6', '&:hover': { color: '#2563eb' } }} onClick={handlePrint}>
                    <PrintIcon sx={{ mr: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Export / Print</Typography>
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
                {tabIndex === 0 && <SalesReports />}
                {tabIndex === 1 && <FinancialReports />}
                {tabIndex === 2 && <ProductReports />}
                {tabIndex === 3 && <CustomerReports />}
                {tabIndex === 4 && <InventoryReports />}
            </Box>
        </Box>
    );
};

export default ReportLayout;
