import express from 'express';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('Admin', 'Manager', 'Cashier'), getCustomers)
    .post(protect, authorize('Admin', 'Manager', 'Cashier'), createCustomer);

router.route('/:id')
    .put(protect, authorize('Admin', 'Manager'), updateCustomer)
    .delete(protect, authorize('Admin', 'Manager'), deleteCustomer);

export default router;
