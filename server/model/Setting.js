import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    storeName: {
        type: String,
        default: 'My Store'
    },
    storeAddress: {
        type: String,
        default: '123 Store Street'
    },
    storePhone: {
        type: String,
        default: '011-2345678'
    },
    storeEmail: {
        type: String,
        default: 'contact@mystore.com'
    },
    currencySymbol: {
        type: String,
        default: 'Rs.'
    },
    defaultTaxRate: {
        type: Number,
        default: 0
    },
    receiptMessage: {
        type: String,
        default: 'Thank you for your business!'
    },
    pointsPerSpend: {
        type: Number,
        default: 1000
    },
    pointsRedemptionRate: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
