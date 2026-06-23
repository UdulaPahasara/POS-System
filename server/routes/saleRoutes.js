import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createSale, getSales, getSalesByCustomer } from '../controllers/saleController.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('Admin', 'Manager'), getSales) // Admins can view ledger
    .post(protect, createSale); // Any logged in user (Cashier/Admin) can create a sale

router.route('/customer/:customerId')
    .get(protect, getSalesByCustomer);

export default router;
