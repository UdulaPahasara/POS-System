import mongoose from 'mongoose';

const purchaseReturnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    refundCost: {
        type: Number,
        required: true,
        min: 0
    }
});

const purchaseReturnSchema = new mongoose.Schema({
    prNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: [purchaseReturnItemSchema],
    totalRefund: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Returned', 'Cancelled'],
        default: 'Pending'
    },
    reason: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('PurchaseReturn', purchaseReturnSchema);
