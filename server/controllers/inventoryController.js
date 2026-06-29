import InventoryLog from '../model/InventoryLog.js';
import { isAdminRole } from '../utils/authUtils.js';

// @desc    Get all inventory logs
// @route   GET /api/inventory/logs
// @access  Private (Admin)
export const getInventoryLogs = async (req, res) => {
    try {
        let branchId = req.user.branch;
        let isAdmin = isAdminRole(req.user);

        if (isAdmin) {
            if (req.query.branchId === 'global') {
                branchId = null; // fetch all
            } else if (req.query.branchId && req.query.branchId !== 'undefined') {
                branchId = req.query.branchId;
            }
        }

        const query = {};
        if (branchId) {
            query.branch = branchId;
        }

        // Fetch logs, populate the product details and admin user details
        const logs = await InventoryLog.find(query)
            .populate('product', 'name sku imageUrl')
            .populate('adminUser', 'username email')
            .sort({ createdAt: -1 }); // Newest first

        res.json(logs);
    } catch (error) {
        console.error('Error fetching inventory logs:', error);
        res.status(500).json({ message: 'Server error fetching inventory logs' });
    }
};
