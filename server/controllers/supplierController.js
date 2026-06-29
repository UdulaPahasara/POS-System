import Supplier from '../model/Supplier.js';
import PurchaseOrder from '../model/PurchaseOrder.js';
import Role from '../model/Role.js';
import User from '../model/User.js';
import Notification from '../model/Notification.js';
import { isAdminRole, getRoleName } from '../utils/authUtils.js';

export const getSuppliers = async (req, res) => {
    try {
        let isAdmin = isAdminRole(req.user);

        let query = {};
        if (!isAdmin && req.user && req.user.branch) {
            query.$or = [
                { branches: req.user.branch },
                { branches: { $exists: false } },
                { branches: { $size: 0 } }
            ];
        }

        const suppliers = await Supplier.find(query).populate('category', 'name').populate('branches', 'name');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);

        let currentActorRole = getRoleName(req.user) || 'Inventory Staff';

        if (currentActorRole !== 'Admin') {
            const rolesToNotify = await Role.find({ roleName: 'Admin' });
            const roleIdsToNotify = rolesToNotify.map(r => r._id);
            const usersToNotify = await User.find({ role: { $in: roleIdsToNotify } });

            for (const user of usersToNotify) {
                const notif = await Notification.create({
                    recipient: user._id,
                    actor: req.user ? req.user._id : undefined,
                    title: 'New Supplier Added',
                    message: `Supplier ${supplier.supplierName || 'added'} has been created.`,
                    type: 'info',
                    link: '/admin/suppliers',
                    actorRole: currentActorRole
                });
                await notif.populate('actor', 'username profilePic');
                if (req.io) {
                    req.io.to(user._id.toString()).emit('new_notification', notif);
                }
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'SUPPLIER' });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        let currentActorRole = getRoleName(req.user) || 'Inventory Staff';

        if (currentActorRole !== 'Admin') {
            const rolesToNotify = await Role.find({ roleName: 'Admin' });
            const roleIdsToNotify = rolesToNotify.map(r => r._id);
            const usersToNotify = await User.find({ role: { $in: roleIdsToNotify } });

            for (const user of usersToNotify) {
                const notif = await Notification.create({
                    recipient: user._id,
                    actor: req.user ? req.user._id : undefined,
                    title: 'Supplier Updated',
                    message: `Details for supplier ${supplier.supplierName || ''} have been updated.`,
                    type: 'info',
                    link: '/admin/suppliers',
                    actorRole: currentActorRole
                });
                await notif.populate('actor', 'username profilePic');
                if (req.io) {
                    req.io.to(user._id.toString()).emit('new_notification', notif);
                }
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'SUPPLIER' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating supplier' });
    }
};

export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        if (req.io) req.io.emit('data_updated', { type: 'SUPPLIER' });
        res.json({ message: 'Supplier removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting supplier' });
    }
};

export const getSupplierPurchaseHistory = async (req, res) => {
    try {
        const history = await PurchaseOrder.find({ supplier: req.params.id })
            .populate('items.product', 'name')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching purchase history' });
    }
};
