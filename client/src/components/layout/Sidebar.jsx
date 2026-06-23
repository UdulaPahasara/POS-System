import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Drawer, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
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
    Assessment as AssessmentIcon,
    Business as SupplierIcon,
    AssignmentReturn as ReturnIcon,
    Description as InvoiceIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const rawNavItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['Admin', 'Manager'] },
    { title: 'Invoices', icon: <InvoiceIcon />, path: '/invoices', roles: ['Admin', 'Manager'] },
    { title: 'Inventory Dashboard', icon: <DashboardIcon />, path: '/inventory-dashboard', roles: ['Inventory Staff'] },
    { title: 'Categories', icon: <CategoryIcon />, path: '/categories', roles: ['Admin'] },
    { title: 'Products', icon: <ProductIcon/>, path: '/products', roles: ['Admin'] },
    { title: 'Purchase Orders', icon: <AssessmentIcon />, path: '/purchase-orders', roles: ['Manager', 'Inventory Staff'] },
    { title: 'Purchase Returns', icon: <ReturnIcon />, path: '/purchase-returns', roles: ['Manager', 'Inventory Staff'] },
    { title: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers', roles: ['Manager'] },
    { title: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: ['Admin', 'Manager', 'Inventory Staff'] },
    { title: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['Admin', 'Manager'] },
    { title: 'Customers', icon: <CustomerIcon />, path: '/customers', roles: ['Manager', 'Cashier'] },
    { title: 'Employees', icon: <EmployeeIcon />, path: '/employees', roles: ['Admin'] },
    { title: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['Admin'] },
];

const AdminSidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRoleObj = user?.role;
    const roleName = typeof userRoleObj === 'object' ? userRoleObj?.roleName : (userRoleObj || 'Cashier');
    
    const getRoleBasePath = (roleName) => {
        if (roleName === 'Admin') return '/admin';
        if (roleName === 'Manager') return '/manager';
        if (roleName === 'Inventory Staff') return '/inventory-staff';
        return '/admin'; // fallback
    };
    
    const roleBasePath = getRoleBasePath(roleName);
    const navItems = rawNavItems.filter(item => item.roles.includes(roleName)).map(item => ({...item, path: roleBasePath + item.path}));

    const handleNavigation = (path) => {
        navigate(path);
        if (mobileOpen) handleDrawerToggle(); // Close drawer on mobile after clicking
    };

    const drawerContent = (
        <Box sx={{ 
            bgcolor: '#0f172a', 
            color: '#fff', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
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
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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
                                sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 } }} 
                            />
                        </ListItemButton>
                    );
                })}
            </List>
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
