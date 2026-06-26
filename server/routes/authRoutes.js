import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
const loginLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,                   // Only 3 tries allowed
  message: "Too many login attempts, please try again after 15 minutes" 
});
router.post('/login', loginLimiter, loginUser);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

export default router;
