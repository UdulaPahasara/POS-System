import mongoose from 'mongoose';
import Product from './model/Product.js';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/POSSystem');
    const products = await Product.find().populate('branchData.branch');
    console.log(`Total Products: ${products.length}`);
    products.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`  Global Reorder Level: ${p.reorderLevel}`);
        if (p.branchData.length === 0) {
            console.log(`  No Branch Data`);
        }
        p.branchData.forEach(b => {
            console.log(`  Branch: ${b.branch ? b.branch.name : 'Unknown'} | Stock: ${b.stock}`);
        });
    });
    process.exit(0);
}

run();
