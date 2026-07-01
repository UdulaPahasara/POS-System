import mongoose from 'mongoose';
import PurchaseOrder from './model/PurchaseOrder.js';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/POSSystem');
    
    const pos = await PurchaseOrder.find({
        poNumber: { $in: ['PO-3911-20', 'PO-5336-19'] }
    });
    
    pos.forEach(po => {
        console.log(`\nPO Number: ${po.poNumber}`);
        po.items.forEach((item, idx) => {
            console.log(`Item ${idx+1}: Product ID = ${item.product}`);
        });
    });
    process.exit(0);
}

run();
