import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    discount: new mongoose.Schema({
        type: { type: String, enum: ['percentage', 'fixed'] },
        amount: { type: Number, default: 0 }
    }, { _id: false }),
    discountedPrice: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const saleSchema = new mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        name: String,
        email: String,
        phone: String
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    orderDiscountPercent: {
        type: Number,
        default: 0
    },
    orderDiscountAmount: {
        type: Number,
        default: 0
    },
    cashAmount: {
        type: Number,
        default: 0
    },
    cardAmount: {
        type: Number,
        default: 0
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    pointsRedeemed: {
        type: Number,
        default: 0
    },
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }]
}, {
    timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
