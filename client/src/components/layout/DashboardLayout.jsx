import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';

const drawerWidth = 260;

const AdminLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0b1120', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
            <CssBaseline />
            
            <AdminSidebar 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle} 
                drawerWidth={drawerWidth} 
            />
            
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <AdminHeader handleDrawerToggle={handleDrawerToggle} />
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowX: 'hidden' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
