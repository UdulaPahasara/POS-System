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
import multer from 'multer';
import path from 'path';

// Configure Multer for image uploads
const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    }
});

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only!'));
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

const router = express.Router();

router.use(protect);

// Profile routes - accessible to any authenticated user
router.route('/profile')
    .get(getUserProfile)
    .put(upload.single('profilePic'), updateUserProfile);

// Admin only routes
router.use(authorize('Admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

export default router;
