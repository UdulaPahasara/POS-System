import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    supplierName: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
