import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../controllers/discountController.js';

const router = express.Router();

// All routes are admin‑only
router.route('/')
  .get(protect, authorize('Admin'), getDiscounts)
  .post(protect, authorize('Admin'), createDiscount);

router.route('/:id')
  .put(protect, authorize('Admin'), updateDiscount)
  .delete(protect, authorize('Admin'), deleteDiscount);

export default router;
