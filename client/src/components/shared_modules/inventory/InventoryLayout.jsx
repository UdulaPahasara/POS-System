import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, TextField, MenuItem } from '@mui/material';
import { Inventory2 as InventoryIcon, History as HistoryIcon } from '@mui/icons-material';
import StockTable from './StockTable';
import HistoryTable from './HistoryTable';
import { branchesApi } from '../../../services/branchesApi';

const InventoryLayout = () => {
    const [tabIndex, setTabIndex] = useState(0);
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
                        setSelectedBranchId(data[0]._id);
                    }
                } catch (error) {
                    console.error('Error fetching branches:', error);
                }
            };
            fetchBranches();
        }
    }, [isAdmin]);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Inventory Management</Typography>
                
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
                        {branches.map(b => (
                            <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                        ))}
                    </TextField>
                )}
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
                {tabIndex === 0 && <StockTable selectedBranchId={selectedBranchId} />}
                {tabIndex === 1 && <HistoryTable selectedBranchId={selectedBranchId} />}
            </Box>
        </Box>
    );
};

export default InventoryLayout;
