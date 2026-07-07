import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Badge, InputBase, Paper, Menu, MenuItem } from '@mui/material';
import { 
    Menu as MenuIcon, 
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Circle as CircleIcon,
    DoneAll as DoneAllIcon,
    Logout,
    Person
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

// Import Role Icons
import adminIcon from '../../assets/MesageIcon/Admin.webp';
import managerIcon from '../../assets/MesageIcon/manager.webp';
import staffIcon from '../../assets/MesageIcon/staff.webp';

const AdminHeader = ({ handleDrawerToggle }) => {
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to get formatted page title from URL
    const getPageTitle = (pathname) => {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length === 0) return 'Dashboard';
        
        // Use the last segment of the path (e.g., 'purchase-orders')
        const lastSegment = parts[parts.length - 1];
        
        // Format string: split by hyphen, capitalize each word, join with space
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    
    const isAdmin = user?.role && (typeof user.role === 'object' ? user.role.roleName : user.role) === 'Admin';

    const handleOpenNotifications = (event) => setAnchorEl(event.currentTarget);
    const handleCloseNotifications = () => setAnchorEl(null);

    const handleOpenProfile = (event) => setProfileAnchorEl(event.currentTarget);
    const handleCloseProfile = () => setProfileAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const handleGoToProfile = () => {
        handleCloseProfile();
        // The current path starts with /admin, /manager, etc. We just replace the last part with /profile
        // e.g. /admin/dashboard -> /admin/profile
        const basePath = window.location.pathname.split('/')[1];
        navigate(`/${basePath}/profile`);
    };

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) markAsRead(notif._id);
        handleCloseNotifications();
        
        if (isAdmin) {
            // Admins just see the message box, no direct navigation
            setSelectedNotification(notif);
        } else if (notif.relatedModel === 'Product' && notif.link) {
            navigate(notif.link, { state: { highlightProductId: notif.relatedId } });
        } else if (notif.relatedModel === 'PurchaseOrder' && notif.link) {
            navigate(notif.link, { state: { highlightPoId: notif.relatedId } });
        } else if (notif.relatedModel === 'PurchaseReturn' && notif.link) {
            navigate(notif.link, { state: { highlightPrId: notif.relatedId } });
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
                        {getPageTitle(location.pathname)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>

                    {/* Notifications */}
                    <IconButton color="inherit" onClick={handleOpenNotifications}>
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon sx={{ color: '#94a3b8' }} />
                        </Badge>
                    </IconButton>

                    {/* User Profile */}
                    <Box 
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, cursor: 'pointer' }}
                        onClick={handleOpenProfile}
                    >
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                                '& .MuiBadge-badge': {
                                    backgroundColor: '#10b981', // green for online
                                    color: '#10b981',
                                    boxShadow: '0 0 0 2px #1e293b',
                                }
                            }}
                        >
                            <Avatar 
                                sx={{ bgcolor: '#3b82f6', width: 35, height: 35 }}
                                src={user?.profilePic ? `http://localhost:5000${user.profilePic}` : ''}
                            >
                                {!user?.profilePic && (user?.username ? user.username.charAt(0).toUpperCase() : 'A')}
                            </Avatar>
                        </Badge>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.username || 'Admin User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {user?.role && typeof user.role === 'object' ? user.role.roleName : (user?.role || 'Administrator')}
                                {user?.branch && ` • ${user.branch.name || user.branch}`}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Toolbar>

            {/* Profile Dropdown */}
            <Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleCloseProfile}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        bgcolor: '#1e293b',
                        color: '#fff',
                        width: 200,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        borderRadius: 2
                    }
                }}
            >
                <MenuItem onClick={handleGoToProfile} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <Person sx={{ mr: 2, color: '#94a3b8', fontSize: 20 }} />
                    My Profile
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
                    <Logout sx={{ mr: 2, color: '#ef4444', fontSize: 20 }} />
                    Logout
                </MenuItem>
            </Menu>

            {/* Notifications Dropdown */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseNotifications}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        bgcolor: '#ffffff',
                        color: '#1e293b',
                        width: 350,
                        maxHeight: 450,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        borderRadius: 2
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>Notifications</Typography>
                    {unreadCount > 0 && (
                        <IconButton size="small" onClick={markAllAsRead} title="Mark all as read" sx={{ color: '#3b82f6', bgcolor: '#eff6ff' }}>
                            <DoneAllIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
                        <Typography variant="body2">No new notifications</Typography>
                    </Box>
                ) : (
                    notifications.map(notif => (
                        <MenuItem 
                            key={notif._id} 
                            onClick={() => handleNotificationClick(notif)}
                            sx={{ 
                                py: 2, 
                                px: 2, 
                                borderBottom: '1px solid #f8fafc',
                                bgcolor: notif.isRead ? 'transparent' : '#f0f9ff',
                                whiteSpace: 'normal',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 2, width: '100%', alignItems: 'flex-start' }}>
                                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {!notif.isRead && <CircleIcon sx={{ color: '#3b82f6', fontSize: 12, position: 'absolute', left: 8 }} />}
                                    {notif.actor && notif.actor.profilePic ? (
                                        <Avatar 
                                            src={`http://localhost:5000${notif.actor.profilePic}`} 
                                            sx={{ width: 32, height: 32 }} 
                                        />
                                    ) : notif.actor && notif.actor.username ? (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: 14 }}>
                                            {notif.actor.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    ) : getRoleIcon(notif.actorRole) ? (
                                        <img src={getRoleIcon(notif.actorRole)} alt={notif.actorRole} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                    ) : (notif.actorRole === 'System' || !notif.actorRole) && getRoleIcon(user?.role && (typeof user.role === 'object' ? user.role.roleName : user.role)) ? (
                                        <img src={getRoleIcon(user?.role && (typeof user.role === 'object' ? user.role.roleName : user.role))} alt="System Alert" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                    ) : (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: 14 }}>
                                            {notif.actorRole ? notif.actorRole.charAt(0) : 'S'}
                                        </Avatar>
                                    )}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: notif.isRead ? 500 : 700, color: notif.type === 'error' ? '#ef4444' : '#0f172a', lineHeight: 1.3 }}>
                                            {notif.title}
                                        </Typography>
                                        {notif.branch && (
                                            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600, bgcolor: '#eff6ff', px: 1, py: 0.2, borderRadius: 1, ml: 1, whiteSpace: 'nowrap' }}>
                                                {notif.branch.name}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.4 }}>
                                        {notif.message}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block', fontWeight: 500 }}>
                                        {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    {selectedNotification?.actor && selectedNotification.actor.profilePic ? (
                        <Avatar 
                            src={`http://localhost:5000${selectedNotification.actor.profilePic}`} 
                            sx={{ width: 30, height: 30 }} 
                        />
                    ) : selectedNotification?.actor && selectedNotification.actor.username ? (
                        <Avatar sx={{ width: 30, height: 30, bgcolor: '#3b82f6', fontSize: 14 }}>
                            {selectedNotification.actor.username.charAt(0).toUpperCase()}
                        </Avatar>
                    ) : selectedNotification && getRoleIcon(selectedNotification.actorRole) && (
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
