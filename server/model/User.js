import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'Cashier', 'Inventory Staff'],
    default: 'Cashier'
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
