import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const location = useLocation();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    let user = null;
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userString) {
        try {
            user = JSON.parse(userString);
        } catch (e) {
            console.error("Failed to parse user data from storage");
        }
    }

    // 1. If not logged in, kick to login page
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. If logged in but doesn't have the required role, kick to POS or Dashboard
    const roleName = typeof user.role === 'object' ? user.role?.roleName : user.role;
    if (allowedRoles && !allowedRoles.includes(roleName)) {
        if (roleName === 'Inventory Staff') {
            return <Navigate to="/inventory-staff/inventory-dashboard" replace />;
        }
        if (roleName === 'Manager') {
            return <Navigate to="/manager/dashboard" replace />;
        }
        if (roleName === 'Cashier') {
            return <Navigate to="/pos" replace />;
        }
        if (roleName === 'Admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // 3. Authorized! Render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
