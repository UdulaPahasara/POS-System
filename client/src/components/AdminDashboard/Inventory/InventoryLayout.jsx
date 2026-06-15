import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { Inventory2 as InventoryIcon, History as HistoryIcon } from '@mui/icons-material';
import StockTable from './StockTable';
import HistoryTable from './HistoryTable';

const InventoryLayout = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Inventory Management</Typography>
            </Box>

            <Paper sx={{ bgcolor: '#1e293b', borderRadius: 2, mb: 3 }}>
                <Tabs 
                    value={tabIndex} 
                    onChange={handleTabChange} 
                    sx={{
                        borderBottom: 1, 
                        borderColor: 'rgba(255,255,255,0.1)',
                        '& .MuiTab-root': {
                            color: '#94a3b8',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '1rem',
                            minHeight: 60
                        },
                        '& .Mui-selected': {
                            color: '#60a5fa'
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#60a5fa',
                            height: 3
                        }
                    }}
                >
                    <Tab icon={<InventoryIcon sx={{ mb: 0, mr: 1 }} />} iconPosition="start" label="Stock Levels" />
                    <Tab icon={<HistoryIcon sx={{ mb: 0, mr: 1 }} />} iconPosition="start" label="Audit Log History" />
                </Tabs>
            </Paper>

            <Box>
                {tabIndex === 0 && <StockTable />}
                {tabIndex === 1 && <HistoryTable />}
            </Box>
        </Box>
    );
};

export default InventoryLayout;
