import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    issueDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    total: {
        type: Number,
        required: true
    },
    sale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
}, {
    timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
