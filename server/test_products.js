import mongoose from 'mongoose';
import Product from './model/Product.js';
import Category from './model/Category.js';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/POSSystem');
    
    const categories = await Category.find();
    console.log("Categories:", categories.map(c => ({ id: c._id.toString(), name: c.name })));

    const products = await Product.find().populate('category', 'name taxRate');
    console.log(`Total Products: ${products.length}`);
    
    if (products.length > 0) {
        console.log("Sample Product Category field:", products[0].category);
        
        const elec = products.filter(p => p.category && p.category.name === 'Electronic');
        console.log(`Products in Electronic: ${elec.length}`);
        if (elec.length > 0) {
            console.log("Sample Electronic Product:", {
                id: elec[0]._id.toString(),
                name: elec[0].name,
                category_id: elec[0].category._id.toString()
            });
        }
    }
    
    process.exit(0);
}

run().catch(console.error);
