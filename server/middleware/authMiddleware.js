import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// Protect routes - Verify JWT Token
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token and populate role and permissions
            req.user = await User.findById(decoded.id).select('-password').populate({
                path: 'role',
                populate: { path: 'permissions' }
            }).populate('branch');

            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        let userRoleName = null;
        if (req.user && req.user.role) {
            userRoleName = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        if (!userRoleName || !roles.includes(userRoleName)) {
            return res.status(403).json({ 
                message: `Forbidden: User role '${userRoleName || 'Unknown'}' is not authorized to access this route` 
            });
        }
        next();
    };
};

// Permission-based authorization middleware
export const requirePermission = (permissionName) => {
    return (req, res, next) => {
        let roleName = null;
        let permissions = [];
        if (req.user && req.user.role) {
            roleName = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
            permissions = typeof req.user.role === 'object' && req.user.role.permissions ? req.user.role.permissions : [];
        }

        if (!roleName) {
            return res.status(403).json({ message: 'Forbidden: No role assigned' });
        }
        
        // Admin bypass
        if (roleName === 'Admin') {
            return next();
        }

        const hasPermission = permissions.some(
            (perm) => perm.permissionName === permissionName
        );

        if (!hasPermission) {
            return res.status(403).json({ 
                message: `Forbidden: Lacks required permission '${permissionName}'` 
            });
        }
        next();
    };
};
