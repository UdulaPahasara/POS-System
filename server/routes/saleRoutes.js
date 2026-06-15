import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createSale, getSales } from '../controllers/saleController.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('Admin', 'Manager'), getSales) // Admins can view ledger
    .post(protect, createSale); // Any logged in user (Cashier/Admin) can create a sale

export default router;
