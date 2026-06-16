import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET is public or protected by just 'protect' if we want all logged-in users to see settings
// For safety, let's just make it 'protect' so any logged-in user can read the currency/tax rate
router.route('/')
    .get(protect, getSettings)
    .put(protect, authorize('Admin'), updateSettings);

export default router;
