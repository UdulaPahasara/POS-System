import express from 'express';
import { loginUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

export default router;
