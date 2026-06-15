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

            // Get user from the token (excluding the password field)
            req.user = await User.findById(decoded.id).select('-password');

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
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden: User role '${req.user ? req.user.role : 'Unknown'}' is not authorized to access this route` 
            });
        }
        next();
    };
};
