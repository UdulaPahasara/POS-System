import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './model/Role.js';
import Permission from './model/Permission.js';
import User from './model/User.js';

dotenv.config();

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // 1. Create Permissions
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

        // 2. Create Roles
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

        // 3. Migrate Existing Users
        // Use native collection to avoid CastError from Mongoose trying to cast string to ObjectId
        const users = await User.collection.find({}).toArray();
        let migratedCount = 0;
        
        for (const user of users) {
            if (typeof user.role === 'string') {
                const roleId = roles[user.role] || roles['Cashier']; // Fallback
                await User.collection.updateOne(
                    { _id: user._id },
                    { $set: { role: roleId } }
                );
                migratedCount++;
            }
        }

        console.log(`Successfully migrated ${migratedCount} users.`);
        console.log('Role seeding completed!');
        process.exit();
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
