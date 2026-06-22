import express from 'express';
import { getInvoices, getInvoiceById } from '../controllers/invoiceController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, requirePermission('VIEW_REPORTS'), getInvoices);

router.route('/:id')
    .get(protect, requirePermission('VIEW_REPORTS'), getInvoiceById);

export default router;
