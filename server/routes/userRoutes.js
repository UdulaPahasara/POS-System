import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserProfile,
    updateUserProfile
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

// Profile routes - accessible to any authenticated user
router.route('/profile')
    .get(getUserProfile)
    .put(updateUserProfile);

// Admin only routes
router.use(authorize('Admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

export default router;
