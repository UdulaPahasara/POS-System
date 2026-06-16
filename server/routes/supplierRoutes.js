import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierPurchaseHistory } from '../controllers/supplierController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getSuppliers)
    .post(protect, createSupplier);

router.route('/:id')
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);

router.route('/:id/history')
    .get(protect, getSupplierPurchaseHistory);

export default router;
