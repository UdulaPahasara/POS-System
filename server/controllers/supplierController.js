import Supplier from '../model/Supplier.js';
import PurchaseOrder from '../model/PurchaseOrder.js';

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().populate('category', 'name');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating supplier' });
    }
};

export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
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
