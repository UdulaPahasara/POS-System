import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'Card']
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    change: {
        type: Number,
        required: true,
        default: 0
    },
    sale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
