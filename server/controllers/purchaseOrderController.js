import PurchaseOrder from '../model/PurchaseOrder.js';
import Product from '../model/Product.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import Notification from '../model/Notification.js';

// @desc    Update a purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private
export const updatePurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalCost } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (po.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot update PO in ${po.status} status` });
        }

        po.supplier = supplier;
        po.items = items;
        po.totalCost = totalCost;
        await po.save();

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_ORDER' });
        res.json(po);
    } catch (error) {
        console.error('Error updating PO:', error);
        res.status(500).json({ message: 'Server error updating PO' });
    }
};

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

        // Notify Managers and Admins
        const roles = await Role.find({ roleName: { $in: ['Admin', 'Manager'] } });
        const roleIds = roles.map(r => r._id);
        const usersToNotify = await User.find({ role: { $in: roleIds } });

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'New Purchase Order',
                message: `Purchase Order ${poNumber} has been created and requires approval.`,
                type: 'info',
                relatedId: po._id,
                relatedModel: 'PurchaseOrder',
                link: '/admin/purchase-orders',
                actorRole: req.user.role ? req.user.role.roleName : 'Admin'
            });
            await notif.populate('actor', 'username profilePic');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_ORDER' });
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

        // Notify Admin and Inventory Staff
        const roles = await Role.find({ roleName: { $in: ['Admin', 'Inventory Staff'] } });
        const roleIds = roles.map(r => r._id);
        const usersToNotify = await User.find({ role: { $in: roleIds } });

        let currentActorRole = 'Manager';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'Purchase Order Approved',
                message: `Purchase Order ${po.poNumber} has been approved and is ready to receive.`,
                type: 'success',
                relatedId: po._id,
                relatedModel: 'PurchaseOrder',
                link: '/admin/purchase-orders',
                actorRole: currentActorRole
            });
            await notif.populate('actor', 'username profilePic');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_ORDER' });
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
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        po.status = 'Received';
        await po.save();

        // Notify Managers and Admins about goods received
        const rolesToNotify = await Role.find({ roleName: { $in: ['Admin', 'Manager'] } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ role: { $in: roleIdsToNotify } });

        let currentActorRole = 'Inventory Staff';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        for (const userToNotify of usersToNotify) {
            const notif = await Notification.create({
                recipient: userToNotify._id,
                actor: req.user ? req.user._id : undefined,
                title: 'Goods Received',
                message: `Purchase Order ${po.poNumber} has been received into inventory.`,
                type: 'success',
                relatedId: po._id,
                relatedModel: 'PurchaseOrder',
                link: '/admin/purchase-orders',
                actorRole: currentActorRole
            });
            await notif.populate('actor', 'username profilePic');
            if (req.io) {
                req.io.to(userToNotify._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) {
            req.io.emit('data_updated', { type: 'PURCHASE_ORDER' });
            req.io.emit('data_updated', { type: 'PRODUCT' });
        }
        res.json(po);
    } catch (error) {
        console.error('Error receiving goods:', error);
        res.status(500).json({ message: 'Server error receiving goods' });
    }
};
