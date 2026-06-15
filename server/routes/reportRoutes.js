import express from 'express';
import { getSalesReport, getInventoryReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sales', protect, authorize('Admin', 'Manager'), getSalesReport);
router.get('/inventory', protect, authorize('Admin', 'Manager'), getInventoryReport);

export default router;
