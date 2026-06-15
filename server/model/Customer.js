import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true // Allows multiple null emails if unique is needed later, but here just sparse
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
