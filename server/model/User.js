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
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role',
    required: true
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
