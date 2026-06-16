import PurchaseReturn from '../model/PurchaseReturn.js';
import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';

export const getPurchaseReturns = async (req, res) => {
    try {
        const prs = await PurchaseReturn.find()
            .populate('supplier')
            .populate('items.product')
            .populate('createdBy', 'username')
            .populate('approvedBy', 'username')
            .sort('-createdAt');
        res.json(prs);
    } catch (error) {
        console.error('Error fetching Purchase Returns:', error);
        res.status(500).json({ message: 'Server error fetching PRs' });
    }
};

export const createPurchaseReturn = async (req, res) => {
    try {
        const { supplier, items, totalRefund, reason } = req.body;

        const count = await PurchaseReturn.countDocuments();
        const prNumber = `PR-${Date.now().toString().slice(-4)}-${count + 1}`;

        const pr = await PurchaseReturn.create({
            prNumber,
            supplier,
            items,
            totalRefund,
            reason,
            createdBy: req.user._id
        });

        res.status(201).json(pr);
    } catch (error) {
        console.error('Error creating PR:', error);
        res.status(500).json({ message: 'Server error creating PR' });
    }
};

export const approvePurchaseReturn = async (req, res) => {
    try {
        const pr = await PurchaseReturn.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        if (pr.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot approve PR in ${pr.status} status` });
        }

        pr.status = 'Approved';
        pr.approvedBy = req.user._id;
        await pr.save();

        res.json(pr);
    } catch (error) {
        console.error('Error approving PR:', error);
        res.status(500).json({ message: 'Server error approving PR' });
    }
};

export const shipPurchaseReturn = async (req, res) => {
    try {
        const pr = await PurchaseReturn.findById(req.params.id).populate('items.product');
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        if (pr.status !== 'Approved') {
            return res.status(400).json({ message: `Cannot return goods for PR in ${pr.status} status` });
        }

        for (const item of pr.items) {
            if (item.product) {
                const product = await Product.findById(item.product._id);
                if (product) {
                    product.stock = Math.max(0, (product.stock || 0) - item.quantity);
                    await product.save();
                    
                    await InventoryLog.create({
                        product: product._id,
                        action: 'Subtract',
                        quantityChanged: item.quantity,
                        newStockLevel: product.stock,
                        reason: `Purchase Return ${pr.prNumber}`,
                        adminUser: req.user._id
                    });
                }
            }
        }

        pr.status = 'Returned';
        await pr.save();

        res.json(pr);
    } catch (error) {
        console.error('Error returning goods:', error);
        res.status(500).json({ message: 'Server error returning goods' });
    }
};
