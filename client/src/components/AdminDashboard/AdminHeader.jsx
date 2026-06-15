import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Badge, InputBase, Paper } from '@mui/material';
import { 
    Menu as MenuIcon, 
    Notifications as NotificationsIcon,
    Search as SearchIcon
} from '@mui/icons-material';

const AdminHeader = ({ handleDrawerToggle }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userString) {
            try {
                setUser(JSON.parse(userString));
            } catch (e) {
                console.error("Error parsing user from storage", e);
            }
        }
    }, []);

    return (
        <AppBar 
            position="sticky" 
            elevation={0}
            sx={{ 
                bgcolor: 'rgba(30, 41, 59, 0.8)', 
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: '#fff',
                width: '100%'
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        aria-label="menu" 
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                        Dashboard
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                    {/* Search Bar */}
                    <Paper
                        elevation={0}
                        sx={{ 
                            p: '2px 10px', 
                            display: { xs: 'none', md: 'flex' }, 
                            alignItems: 'center', 
                            width: 250,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2
                        }}
                    >
                        <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
                        <InputBase
                            placeholder="Search..."
                            sx={{ ml: 1, flex: 1, color: '#fff', fontSize: '0.9rem' }}
                        />
                    </Paper>

                    {/* Notifications */}
                    <IconButton color="inherit">
                        <Badge badgeContent={3} color="error">
                            <NotificationsIcon sx={{ color: '#94a3b8' }} />
                        </Badge>
                    </IconButton>

                    {/* User Profile */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }}>
                        <Avatar sx={{ bgcolor: '#3b82f6', width: 35, height: 35 }}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.name || 'Admin User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {user?.role || 'Administrator'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default AdminHeader;
