import mongoose from 'mongoose';

const loyaltyTransactionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    sale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    pointsRedeemed: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);

export default LoyaltyTransaction;
