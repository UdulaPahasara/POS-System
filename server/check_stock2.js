import mongoose from 'mongoose';
import Product from './model/Product.js';
import User from './model/User.js';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/POSSystem');
    
    // Find the Inventory Staff user
    const user = await User.findOne({ username: 'InventoryStaff001' }).populate('branch');
    if (!user) {
        console.log("No InventoryStaff001 found.");
        process.exit(1);
    }
    
    console.log(`InventoryStaff branch: ${user.branch ? user.branch._id : 'null'}`);
    
    const products = await Product.find().populate('branchData.branch');
    let countMatch = 0;
    
    products.forEach(p => {
        const matches = p.branchData.some(b => {
            if (!b.branch) return false;
            const bId = b.branch._id ? b.branch._id.toString() : b.branch.toString();
            return bId === user.branch._id.toString();
        });
        
        if (matches) {
            countMatch++;
            console.log(`Match: ${p.name}`);
        }
    });
    
    console.log(`Total matched products: ${countMatch}`);
    process.exit(0);
}

run();
