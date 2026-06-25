import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './model/Branch.js';
import Supplier from './model/Supplier.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const branches = await Branch.find({});
        const branchIds = branches.map(b => b._id);

        if (branchIds.length === 0) {
            console.log('No branches found.');
            process.exit(0);
        }

        const result = await Supplier.updateMany(
            {}, 
            { $set: { branches: branchIds } }
        );
        
        console.log(`Updated ${result.modifiedCount} suppliers with branches.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

migrate();
