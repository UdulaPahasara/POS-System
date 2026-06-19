import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Badge, InputBase, Paper, Menu, MenuItem } from '@mui/material';
import { 
    Menu as MenuIcon, 
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Circle as CircleIcon,
    DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

// Import Role Icons
import adminIcon from '../../assets/MesageIcon/Admin.webp';
import managerIcon from '../../assets/MesageIcon/manager.webp';
import staffIcon from '../../assets/MesageIcon/staff.webp';

const AdminHeader = ({ handleDrawerToggle }) => {
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    
    const isAdmin = user?.role && (typeof user.role === 'object' ? user.role.roleName : user.role) === 'Admin';

    const handleOpenNotifications = (event) => setAnchorEl(event.currentTarget);
    const handleCloseNotifications = () => setAnchorEl(null);

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) markAsRead(notif._id);
        handleCloseNotifications();
        
        if (notif.relatedModel === 'Product' && notif.link) {
            navigate(notif.link, { state: { highlightProductId: notif.relatedId } });
        } else if (isAdmin) {
            // Admins just see the message box, no direct navigation
            setSelectedNotification(notif);
        } else if (notif.link) {
            // Normal notifications with a link should navigate directly
            navigate(notif.link);
        } else {
            setSelectedNotification(notif);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Admin': return adminIcon;
            case 'Manager': return managerIcon;
            case 'Inventory Staff': return staffIcon;
            default: return null;
        }
    };

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
                    <IconButton color="inherit" onClick={handleOpenNotifications}>
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon sx={{ color: '#94a3b8' }} />
                        </Badge>
                    </IconButton>

                    {/* User Profile */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }}>
                        <Avatar sx={{ bgcolor: '#3b82f6', width: 35, height: 35 }}>
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.username || 'Admin User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {user?.role && typeof user.role === 'object' ? user.role.roleName : (user?.role || 'Administrator')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Toolbar>

            {/* Notifications Dropdown */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseNotifications}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        bgcolor: '#1e293b',
                        color: '#fff',
                        width: 320,
                        maxHeight: 400,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
                    {unreadCount > 0 && (
                        <IconButton size="small" onClick={markAllAsRead} title="Mark all as read" sx={{ color: '#3b82f6' }}>
                            <DoneAllIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>
                        <Typography variant="body2">No notifications</Typography>
                    </Box>
                ) : (
                    notifications.map(notif => (
                        <MenuItem 
                            key={notif._id} 
                            onClick={() => handleNotificationClick(notif)}
                            sx={{ 
                                py: 1.5, 
                                px: 2, 
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                bgcolor: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                whiteSpace: 'normal',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {!notif.isRead && <CircleIcon sx={{ color: '#3b82f6', fontSize: 10 }} />}
                                    {getRoleIcon(notif.actorRole) ? (
                                        <img src={getRoleIcon(notif.actorRole)} alt={notif.actorRole} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                    ) : (
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#3b82f6', fontSize: 12 }}>
                                            {notif.actorRole ? notif.actorRole.charAt(0) : 'S'}
                                        </Avatar>
                                    )}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: notif.isRead ? 400 : 600, color: notif.type === 'error' ? '#ef4444' : '#fff' }}>
                                        {notif.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                                        {notif.message}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mt: 0.5, display: 'block' }}>
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Menu>
            {/* Detailed Message Box Dialog */}
            <Dialog 
                open={Boolean(selectedNotification)} 
                onClose={() => setSelectedNotification(null)}
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: '400px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {selectedNotification && getRoleIcon(selectedNotification.actorRole) && (
                        <img src={getRoleIcon(selectedNotification.actorRole)} alt="Role" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                    )}
                    {selectedNotification?.title}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <DialogContentText sx={{ color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                        {selectedNotification?.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={() => setSelectedNotification(null)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                        Close
                    </Button>
                    {selectedNotification?.link && selectedNotification.relatedModel !== 'Product' && !isAdmin && (
                        <Button 
                            variant="contained" 
                            onClick={() => {
                                navigate(selectedNotification.link);
                                setSelectedNotification(null);
                            }}
                            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}
                        >
                            View Details
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </AppBar>
    );
};

export default AdminHeader;
