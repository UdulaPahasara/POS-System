import express from 'express';
import { 
    getPurchaseOrders,
    createPurchaseOrder,
    approvePurchaseOrder,
    receiveGoods
} from '../controllers/purchaseOrderController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getPurchaseOrders)
    .post(protect, requirePermission('CREATE_PO'), createPurchaseOrder);

router.route('/:id/approve')
    .put(protect, requirePermission('APPROVE_PO'), approvePurchaseOrder);

router.route('/:id/receive')
    .put(protect, requirePermission('RECEIVE_INVENTORY'), receiveGoods);

export default router;
