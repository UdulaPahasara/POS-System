import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema({
    taxName: {
        type: String,
        required: [true, 'Tax name is required'],
        unique: true,
        trim: true
    },
    rate: {
        type: Number,
        required: [true, 'Tax rate is required'],
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

const Tax = mongoose.model('Tax', taxSchema);

export default Tax;
