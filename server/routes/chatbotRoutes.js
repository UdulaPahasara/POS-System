import express from 'express';
import { chatWithAI } from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to handle chat messages
// Protected route so only logged in users can access the AI
router.post('/', protect, chatWithAI);

export default router;
