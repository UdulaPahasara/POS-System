import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getTaxes,
    createTax,
    updateTax,
    deleteTax
} from '../controllers/taxController.js';

const router = express.Router();

router.route('/')
    .get(protect, getTaxes)
    .post(protect, authorize('Admin', 'Manager'), createTax);

router.route('/:id')
    .put(protect, authorize('Admin', 'Manager'), updateTax)
    .delete(protect, authorize('Admin'), deleteTax);

export default router;
