import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getInventoryLogs } from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/logs')
    .get(protect, getInventoryLogs);

export default router;
