import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    type: { type: String, enum: ['percentage','fixed', 'none'], default: 'none' },
    amount: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    barcodeValue: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: 0
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: 0
    },
    reorderLevel: {
        type: Number,
        required: [true, 'Reorder level is required'],
        min: 0
    },
    description: {
        type: String
    },
    discount: {
        type: discountSchema,
        default: () => ({ type: 'none', amount: 0 })
    },
    stock: {
        type: Number,
        default: 0
    },
    reservedStock: {
        type: Number,
        default: 0
    },
    damagedStock: {
        type: Number,
        default: 0
    },
    branchData: [{
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        sellingPrice: { type: Number, min: 0 },
        stock: { type: Number, default: 0 },
        reservedStock: { type: Number, default: 0 },
        damagedStock: { type: Number, default: 0 }
    }],
    imageUrl: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;
