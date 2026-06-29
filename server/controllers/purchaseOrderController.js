import PurchaseOrder from '../model/PurchaseOrder.js';
import Product from '../model/Product.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import Notification from '../model/Notification.js';
import { isAdminRole, getRoleName } from '../utils/authUtils.js';

export const updatePurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalCost } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });

        // Snapshot product names
        for (let item of items) {
            const productDoc = await Product.findById(item.product);
            item.productName = productDoc ? productDoc.name : 'Unknown Product';
        }

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

export const getPurchaseOrders = async (req, res) => {
    try {
        let filter = {};
        let isAdmin = isAdminRole(req.user);

        if (!isAdmin) {
            if (!req.user.branch) return res.status(403).json({ message: 'No branch assigned' });
            filter.branch = req.user.branch;
        } else if (req.query.branchId) {
            filter.branch = req.query.branchId;
        }

        const pos = await PurchaseOrder.find(filter)
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

export const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalCost } = req.body;
        const branchId = req.user.branch;

        if (!branchId) return res.status(400).json({ message: 'User must be assigned to a branch to create PO' });

        // Snapshot product names
        for (let item of items) {
            const productDoc = await Product.findById(item.product);
            item.productName = productDoc ? productDoc.name : 'Unknown Product';
        }

        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-${Date.now().toString().slice(-4)}-${count + 1}`;

        const po = await PurchaseOrder.create({
            poNumber,
            supplier,
            branch: branchId,
            items,
            totalCost,
            createdBy: req.user._id
        });

        const roles = await Role.find({ roleName: { $in: ['Admin', 'Manager', 'Super Admin'] } });
        const roleIds = roles.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIds },
            $or: [
                { branch: branchId },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

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
                actorRole: req.user.role ? req.user.role.roleName : 'Admin',
                branch: branchId
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
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

        const roles = await Role.find({ roleName: { $in: ['Admin', 'Inventory Staff', 'Super Admin'] } });
        const roleIds = roles.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIds },
            $or: [
                { branch: po.branch },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

        let currentActorRole = getRoleName(req.user) || 'Manager';

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
                actorRole: currentActorRole,
                branch: po.branch
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
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

export const receiveGoods = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate('items.product');
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (po.status !== 'Approved') {
            return res.status(400).json({ message: `Cannot receive goods for PO in ${po.status} status` });
        }

        const productIds = po.items.map(item => item.product ? item.product._id : null).filter(id => id);
        const productsToUpdate = await Product.find({ _id: { $in: productIds } });
        const bulkOps = [];

        for (const item of po.items) {
            if (item.product) {
                const product = productsToUpdate.find(p => p._id.toString() === item.product._id.toString());
                if (product) {
                    let bDataIndex = product.branchData.findIndex(b => b.branch.toString() === po.branch.toString());
                    if (bDataIndex === -1) {
                        product.branchData.push({ branch: po.branch, sellingPrice: product.sellingPrice || 0, stock: 0 });
                        bDataIndex = product.branchData.length - 1;
                    }
                    product.branchData[bDataIndex].stock += item.quantity;

                    bulkOps.push({
                        updateOne: {
                            filter: { _id: product._id },
                            update: { $set: { branchData: product.branchData } }
                        }
                    });
                }
            }
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        po.status = 'Received';
        await po.save();

        const rolesToNotify = await Role.find({ roleName: { $in: ['Admin', 'Manager', 'Super Admin'] } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIdsToNotify },
            $or: [
                { branch: po.branch },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

        let currentActorRole = getRoleName(req.user) || 'Inventory Staff';

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
                actorRole: currentActorRole,
                branch: po.branch
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
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
