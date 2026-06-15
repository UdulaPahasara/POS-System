import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    adjustStock
} from '../controllers/productController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        // Create unique filename: fieldname-timestamp.ext
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    }
});

// File validation (only accept images)
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

// Routes
// We map the root '/' to GET all and POST create
router.route('/')
    .get(protect, getProducts)
    .post(protect, authorize('Admin'), upload.single('image'), createProduct);

// We map '/:id' to PUT update and DELETE remove
router.route('/:id')
    .put(protect, authorize('Admin'), upload.single('image'), updateProduct)
    .delete(protect, authorize('Admin'), deleteProduct);

// Specialized route just for updating inventory stock levels
router.put('/:id/stock', protect, authorize('Admin', 'Manager'), adjustStock);

export default router;
