import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    roleName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
