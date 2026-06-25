import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Branch name is required'],
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Branch address is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Closed'],
        default: 'Active'
    }
}, {
    timestamps: true
});

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
