import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    permissionName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('Permission', permissionSchema);
