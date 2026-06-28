import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import User from './model/User.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import purchaseReturnRoutes from './routes/purchaseReturnRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import Role from './model/Role.js';
import Branch from './model/Branch.js';
import Product from './model/Product.js';
import Sale from './model/Sale.js';
import Invoice from './model/Invoice.js';
import PurchaseOrder from './model/PurchaseOrder.js';
import PurchaseReturn from './model/PurchaseReturn.js';
import InventoryLog from './model/InventoryLog.js';
import Permission from './model/Permission.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Attach socket.io to req object so controllers can use it
app.use((req, res, next) => {
    req.io = io;
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Expose the 'uploads' folder so the frontend can access uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/branches', branchRoutes);

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

const migrateBranches = async () => {
    try {
        console.log('Running branch migration...');
        
        let mainBranch = await Branch.findOne({ name: 'Main Branch' });
        if (!mainBranch) {
            mainBranch = await Branch.create({
                name: 'Main Branch',
                address: '123 Main Street',
                status: 'Active'
            });
            console.log('✅ Created default Main Branch.');
        }

        const branchId = mainBranch._id;

        // Update Users
        const userUpdate = await User.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );
        if (userUpdate.modifiedCount > 0) console.log(`✅ Migrated ${userUpdate.modifiedCount} users to Main Branch.`);

        // Update Sales
        const saleUpdate = await Sale.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );
        if (saleUpdate.modifiedCount > 0) console.log(`✅ Migrated ${saleUpdate.modifiedCount} sales to Main Branch.`);

        // Update Invoices
        const invoiceUpdate = await Invoice.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );

        // Update POs
        const poUpdate = await PurchaseOrder.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );

        // Update PRs
        const prUpdate = await PurchaseReturn.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );

        // Update InventoryLogs
        const logUpdate = await InventoryLog.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: branchId } }
        );

        // Update Products: ensure Main Branch branchData exists
        const products = await Product.find({ $or: [{ branchData: { $exists: false } }, { branchData: { $size: 0 } }] });
        let productMigratedCount = 0;
        for (const p of products) {
            p.branchData.push({
                branch: branchId,
                sellingPrice: p.sellingPrice || 0,
                stock: p.stock || 0,
                reservedStock: p.reservedStock || 0,
                damagedStock: p.damagedStock || 0
            });
            await p.save();
            productMigratedCount++;
        }
        if (productMigratedCount > 0) console.log(`✅ Migrated ${productMigratedCount} products to use branchData array.`);

        // Cleanup: remove phantom branchData entries (sellingPrice = 0, not Main Branch)
        // These were created by a bug in the old ProductDialog that pre-populated all branches
        const allProducts = await Product.find({ 'branchData.1': { $exists: true } }); // products with >1 branchData
        let cleanedCount = 0;
        for (const p of allProducts) {
            const before = p.branchData.length;
            p.branchData = p.branchData.filter(b => {
                const isMainBranch = b.branch && b.branch.toString() === branchId.toString();
                const hasRealPrice = b.sellingPrice > 0;
                return isMainBranch || hasRealPrice; // keep Main Branch always; keep others only if configured
            });
            if (p.branchData.length !== before) {
                await p.save();
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) console.log(`✅ Cleaned phantom branchData entries from ${cleanedCount} products.`);

    } catch (e) {
        console.error('❌ Error during branch migration:', e);
    }
};

const PORT = process.env.PORT || 5000;

// Connect to Database, then Start Server
connectDB().then(async () => {
    await runSeeder();
    await seedAdmin(); 
    await migrateBranches();
    
    io.on('connection', (socket) => {
        console.log('A user connected via socket.io:', socket.id);
        
        socket.on('join_room', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their notification room.`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
});
