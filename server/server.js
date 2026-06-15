import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './model/User.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Expose the 'uploads' folder so the frontend can access uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);

// Add a basic route to test server status
app.get('/', (req, res) => {
    res.send('POS Backend API is running...');
});

// Function to automatically create Admin if it doesn't exist
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!adminExists) {
            console.log('Admin user not found. Seeding from .env...');
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            await User.create({
                username: 'SuperAdmin',
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                role: 'Admin'
            });
            console.log('✅ Default Admin user created successfully!');
        } else {
            console.log('✅ Admin user already exists in database.');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

const PORT = process.env.PORT || 5000;

// Connect to Database, then Start Server
connectDB().then(() => {
    // Check for admin immediately after DB connects
    seedAdmin(); 
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
});
