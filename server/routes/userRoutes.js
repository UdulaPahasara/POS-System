import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication and Admin role
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

export default router;
