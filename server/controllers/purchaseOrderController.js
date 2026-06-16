import PurchaseOrder from '../model/PurchaseOrder.js';
import Product from '../model/Product.js';

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find()
            .populate('supplier')
            .populate('items.product')
            .populate('createdBy', 'username')
            .populate('approvedBy', 'username')
            .sort('-createdAt');
        res.json(pos);
    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ message: 'Server error fetching POs' });
    }
};

// @desc    Create a new purchase order
// @route   POST /api/purchase-orders
// @access  Private (Requires CREATE_PO permission)
export const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalCost } = req.body;

        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-${Date.now().toString().slice(-4)}-${count + 1}`;

        const po = await PurchaseOrder.create({
            poNumber,
            supplier,
            items,
            totalCost,
            createdBy: req.user._id
        });

        res.status(201).json(po);
    } catch (error) {
        console.error('Error creating PO:', error);
        res.status(500).json({ message: 'Server error creating PO' });
    }
};

// @desc    Approve a purchase order
// @route   PUT /api/purchase-orders/:id/approve
// @access  Private (Requires APPROVE_PO permission)
export const approvePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (po.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot approve PO in ${po.status} status` });
        }

        po.status = 'Approved';
        po.approvedBy = req.user._id;
        await po.save();

        res.json(po);
    } catch (error) {
        console.error('Error approving PO:', error);
        res.status(500).json({ message: 'Server error approving PO' });
    }
};

// @desc    Receive goods for a purchase order
// @route   PUT /api/purchase-orders/:id/receive
// @access  Private (Requires RECEIVE_INVENTORY permission)
export const receiveGoods = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate('items.product');
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (po.status !== 'Approved') {
            return res.status(400).json({ message: `Cannot receive goods for PO in ${po.status} status` });
        }

        for (const item of po.items) {
            if (item.product) {
                const product = await Product.findById(item.product._id);
                if (product) {
                    product.stock = (product.stock || 0) + item.quantity;
                    await product.save();
                }
            }
        }

        po.status = 'Received';
        await po.save();

        res.json(po);
    } catch (error) {
        console.error('Error receiving goods:', error);
        res.status(500).json({ message: 'Server error receiving goods' });
    }
};
