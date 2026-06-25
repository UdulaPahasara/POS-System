import PurchaseReturn from '../model/PurchaseReturn.js';
import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import Notification from '../model/Notification.js';

export const updatePurchaseReturn = async (req, res) => {
    try {
        const { supplier, items, totalRefund, reason } = req.body;
        const pr = await PurchaseReturn.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        if (pr.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot update PR in ${pr.status} status` });
        }

        pr.supplier = supplier;
        pr.items = items;
        pr.totalRefund = totalRefund;
        pr.reason = reason;
        await pr.save();

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_RETURN' });
        res.json(pr);
    } catch (error) {
        console.error('Error updating PR:', error);
        res.status(500).json({ message: 'Server error updating PR' });
    }
};

export const getPurchaseReturns = async (req, res) => {
    try {
        let filter = {};
        let isAdmin = false;
        if (req.user && req.user.role) {
            const roleName = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
            if (roleName === 'Admin') isAdmin = true;
        }

        if (!isAdmin) {
            if (!req.user.branch) return res.status(403).json({ message: 'No branch assigned' });
            filter.branch = req.user.branch;
        } else if (req.query.branchId) {
            filter.branch = req.query.branchId;
        }

        const prs = await PurchaseReturn.find(filter)
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
        const branchId = req.user.branch;

        if (!branchId) return res.status(400).json({ message: 'User must be assigned to a branch to create PR' });

        const count = await PurchaseReturn.countDocuments();
        const prNumber = `PR-${Date.now().toString().slice(-4)}-${count + 1}`;

        const pr = await PurchaseReturn.create({
            prNumber,
            supplier,
            branch: branchId,
            items,
            totalRefund,
            reason,
            createdBy: req.user._id
        });

        const rolesToNotify = await Role.find({ roleName: { $in: ['Admin', 'Manager', 'Super Admin'] } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIdsToNotify },
            $or: [
                { branch: branchId },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

        let currentActorRole = 'Inventory Staff';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'New Purchase Return',
                message: `Purchase Return ${prNumber} has been created and requires approval.`,
                type: 'info',
                relatedId: pr._id,
                relatedModel: 'PurchaseReturn',
                link: '/admin/purchase-returns',
                actorRole: currentActorRole,
                branch: branchId
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_RETURN' });
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

        const rolesToNotify = await Role.find({ roleName: { $in: ['Admin', 'Inventory Staff', 'Super Admin'] } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIdsToNotify },
            $or: [
                { branch: pr.branch },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

        let currentActorRole = 'Manager';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'Purchase Return Approved',
                message: `Purchase Return ${pr.prNumber} has been approved and is ready to be returned to supplier.`,
                type: 'success',
                relatedId: pr._id,
                relatedModel: 'PurchaseReturn',
                link: '/admin/purchase-returns',
                actorRole: currentActorRole,
                branch: pr.branch
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PURCHASE_RETURN' });
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
                    let bDataIndex = product.branchData.findIndex(b => b.branch.toString() === pr.branch.toString());
                    if (bDataIndex !== -1) {
                        product.branchData[bDataIndex].stock = Math.max(0, product.branchData[bDataIndex].stock - item.quantity);
                        await product.save();

                        await InventoryLog.create({
                            product: product._id,
                            branch: pr.branch,
                            action: 'Subtract',
                            quantityChanged: item.quantity,
                            newStockLevel: product.branchData[bDataIndex].stock,
                            reason: `Purchase Return ${pr.prNumber}`,
                            adminUser: req.user._id
                        });
                    }
                }
            }
        }

        pr.status = 'Returned';
        await pr.save();

        const rolesToNotify = await Role.find({ roleName: { $in: ['Admin', 'Manager', 'Super Admin'] } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ 
            role: { $in: roleIdsToNotify },
            $or: [
                { branch: pr.branch },
                { branch: { $exists: false } },
                { branch: null }
            ]
        });

        let currentActorRole = 'Inventory Staff';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        for (const userToNotify of usersToNotify) {
            const notif = await Notification.create({
                recipient: userToNotify._id,
                actor: req.user ? req.user._id : undefined,
                title: 'Goods Returned',
                message: `Purchase Return ${pr.prNumber} has been shipped back to the supplier.`,
                type: 'success',
                relatedId: pr._id,
                relatedModel: 'PurchaseReturn',
                link: '/admin/purchase-returns',
                actorRole: currentActorRole,
                branch: pr.branch
            });
            await notif.populate('actor', 'username profilePic');
            await notif.populate('branch', 'name');
            if (req.io) {
                req.io.to(userToNotify._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) {
            req.io.emit('data_updated', { type: 'PURCHASE_RETURN' });
            req.io.emit('data_updated', { type: 'PRODUCT' });
        }
        res.json(pr);
    } catch (error) {
        console.error('Error returning goods:', error);
        res.status(500).json({ message: 'Server error returning goods' });
    }
};
