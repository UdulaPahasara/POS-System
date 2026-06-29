import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Branch'
    },
    action: {
        type: String,
        required: true,
        enum: ['Add', 'Subtract', 'Set']
    },
    quantityChanged: {
        type: Number,
        required: true
    },
    newStockLevel: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    adminUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});
inventoryLogSchema.index({ product: 1, createdAt: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;
