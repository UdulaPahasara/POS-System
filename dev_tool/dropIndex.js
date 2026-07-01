import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos_system');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        
        // List indexes
        const indexes = await db.collection('sales').indexes();
        console.log('Current indexes on sales collection:', indexes);

        // Try to drop the index
        try {
            await db.collection('sales').dropIndex('invoiceNumber_1');
            console.log('Successfully dropped invoiceNumber_1 index from sales collection');
        } catch (e) {
            console.log('Could not drop index (might not exist):', e.message);
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dropIndex();
