import InventoryLog from '../model/InventoryLog.js';

// @desc    Get all inventory logs
// @route   GET /api/inventory/logs
// @access  Private (Admin)
export const getInventoryLogs = async (req, res) => {
    try {
        // Fetch logs, populate the product details and admin user details
        const logs = await InventoryLog.find({})
            .populate('product', 'name sku imageUrl')
            .populate('adminUser', 'username email')
            .sort({ createdAt: -1 }); // Newest first

        res.json(logs);
    } catch (error) {
        console.error('Error fetching inventory logs:', error);
        res.status(500).json({ message: 'Server error fetching inventory logs' });
    }
};
