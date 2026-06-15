import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Drawer } from '@mui/material';
import { 
    Dashboard as DashboardIcon,
    PointOfSale as POSIcon,
    Inventory as InventoryIcon,
    Category as ProductIcon,
    Badge as EmployeeIcon,
    People as CustomerIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    LocalOffer as CategoryIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { title: 'Catergory', icon: <CategoryIcon />, path: '/admin/category' },
    { title: 'Products', icon: <ProductIcon/>, path: '/admin/products', adminOnly: true },
    { title: 'Inventory', icon: <InventoryIcon />, path: '/admin/inventory' },
    { title: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
    { title: 'Customers', icon: <CustomerIcon />, path: '/admin/customers' },
    { title: 'Employees', icon: <EmployeeIcon />, path: '/admin/employees', adminOnly: true },
    { title: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', adminOnly: true },
];

const AdminSidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'Admin';

    const handleNavigation = (path) => {
        navigate(path);
        if (mobileOpen) handleDrawerToggle(); // Close drawer on mobile after clicking
    };

    const handleLogout = () => {
        // Clear all session tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        navigate('/login');
        if (mobileOpen) handleDrawerToggle();
    };

    const drawerContent = (
        <Box sx={{ 
            bgcolor: '#0f172a', 
            color: '#fff', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.05)'
        }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        fontWeight: 800, 
                        background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}
                >
                    POINT OF SALE   
                </Typography>
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <List sx={{ px: 2, flexGrow: 1, mt: 2 }}>
                {navItems.filter(item => !(item.adminOnly && userRole !== 'Admin')).map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    return (
                        <ListItemButton 
                            key={item.title}
                            onClick={() => handleNavigation(item.path)}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: isActive ? '#60a5fa' : '#94a3b8',
                                '&:hover': {
                                    bgcolor: 'rgba(59, 130, 246, 0.25)',
                                    color: '#fff',
                                    '& .MuiListItemIcon-root': { color: '#fff' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: isActive ? '#60a5fa' : '#94a3b8', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.title} 
                                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }} 
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ p: 2 }}>
                <ListItemButton 
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        color: '#ef4444',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                    }}
                >
                    <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better open performance on mobile
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#0f172a' },
                }}
            >
                {drawerContent}
            </Drawer>
            
            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#0f172a' },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default AdminSidebar;
