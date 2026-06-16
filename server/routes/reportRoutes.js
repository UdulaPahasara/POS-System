import express from 'express';
import { 
    getSalesReport, 
    getInventoryReport,
    getAdvancedSalesReport,
    getFinancialReport,
    getProductReport,
    getCustomerReport,
    getDashboardStats
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Admin', 'Manager'), getDashboardStats);
router.get('/sales', protect, authorize('Admin', 'Manager'), getSalesReport);
router.get('/sales/advanced', protect, authorize('Admin', 'Manager'), getAdvancedSalesReport);
router.get('/inventory', protect, authorize('Admin', 'Manager'), getInventoryReport);
router.get('/financial', protect, authorize('Admin', 'Manager'), getFinancialReport);
router.get('/products', protect, authorize('Admin', 'Manager'), getProductReport);
router.get('/customers', protect, authorize('Admin', 'Manager'), getCustomerReport);

export default router;
