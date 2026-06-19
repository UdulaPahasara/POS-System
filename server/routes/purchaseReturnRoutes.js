import express from 'express';
import { 
    getPurchaseReturns, 
    createPurchaseReturn, 
    updatePurchaseReturn,
    approvePurchaseReturn, 
    shipPurchaseReturn 
} from '../controllers/purchaseReturnController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getPurchaseReturns)
    .post(protect, createPurchaseReturn);

router.route('/:id')
    .put(protect, updatePurchaseReturn);

router.route('/:id/approve')
    .put(protect, approvePurchaseReturn);

router.route('/:id/return')
    .put(protect, shipPurchaseReturn);

export default router;
