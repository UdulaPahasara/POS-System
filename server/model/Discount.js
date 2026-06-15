import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true }, // percentage or fixed amount
  amount: { type: Number, required: true }, // if percentage, 0-100; if fixed, currency amount
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Discount', DiscountSchema);
