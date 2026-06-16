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
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import purchaseReturnRoutes from './routes/purchaseReturnRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import Role from './model/Role.js';
import Permission from './model/Permission.js';
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
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingRoutes);

// Add a basic route to test server status
app.get('/', (req, res) => {
    res.send('POS Backend API is running...');
});

const runSeeder = async () => {
    try {
        console.log('Running automatic database seeder...');
        const permNames = [
            'CREATE_PO', 'APPROVE_PO', 'RECEIVE_INVENTORY', 
            'UPDATE_STOCK', 'VIEW_REPORTS', 'MANAGE_CUSTOMERS'
        ];
        
        const perms = {};
        for (const name of permNames) {
            let p = await Permission.findOne({ permissionName: name });
            if (!p) {
                p = await Permission.create({ permissionName: name, description: `Permission to ${name}` });
            }
            perms[name] = p._id;
        }

        const roleDefinitions = {
            'Admin': Object.values(perms),
            'Manager': [perms['APPROVE_PO'], perms['VIEW_REPORTS'], perms['MANAGE_CUSTOMERS']],
            'Inventory Staff': [perms['CREATE_PO'], perms['RECEIVE_INVENTORY'], perms['UPDATE_STOCK']],
            'Cashier': [perms['MANAGE_CUSTOMERS']]
        };

        const roles = {};
        for (const [rName, rPerms] of Object.entries(roleDefinitions)) {
            let r = await Role.findOne({ roleName: rName });
            if (r) {
                r.permissions = rPerms;
                await r.save();
            } else {
                r = await Role.create({ roleName: rName, permissions: rPerms });
            }
            roles[rName] = r._id;
        }

        const users = await User.collection.find({}).toArray();
        let migratedCount = 0;
        for (const user of users) {
            if (typeof user.role === 'string') {
                const roleId = roles[user.role] || roles['Cashier'];
                await User.collection.updateOne({ _id: user._id }, { $set: { role: roleId } });
                migratedCount++;
            }
        }
        if (migratedCount > 0) console.log(`✅ Successfully migrated ${migratedCount} users to dynamic roles.`);
    } catch (e) {
        console.error('❌ Error in seeder:', e);
    }
};

// Function to automatically create Admin if it doesn't exist
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!adminExists) {
            console.log('Admin user not found. Seeding from .env...');
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            const adminRole = await Role.findOne({ roleName: 'Admin' });
            
            if (adminRole) {
                await User.create({
                    username: 'SuperAdmin',
                    email: process.env.ADMIN_EMAIL,
                    password: hashedPassword,
                    role: adminRole._id
                });
                console.log('✅ Default Admin user created successfully!');
            } else {
                console.log('⚠️ Admin Role not found. Run the seeder first!');
            }
        } else {
            console.log('✅ Admin user already exists in database.');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

const PORT = process.env.PORT || 5000;

// Connect to Database, then Start Server
connectDB().then(async () => {
    await runSeeder();
    await seedAdmin(); 
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
});
