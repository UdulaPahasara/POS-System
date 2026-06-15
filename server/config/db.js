import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected successfully!");
        
        // TEMPORARY FIX: Drop the obsolete invoiceNumber index from sales
        // since we moved invoices to a separate collection.
        try {
            await mongoose.connection.db.collection('sales').dropIndex('invoiceNumber_1');
            console.log("Successfully dropped obsolete invoiceNumber index from sales collection");
        } catch (e) {
            // Ignore if index doesn't exist
        }
    } catch (err) {
        console.error("MongoDB Connection failed:", err);
        process.exit(1); // Stop the server if the database fails to connect
    }
};

export default connectDB;
