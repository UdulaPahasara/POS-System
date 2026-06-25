import express from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getBranches)
    .post(protect, authorize('Admin'), createBranch);

router.route('/:id')
    .put(protect, authorize('Admin'), updateBranch)
    .delete(protect, authorize('Admin'), deleteBranch);

export default router;
