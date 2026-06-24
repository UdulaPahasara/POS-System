import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';
import Notification from '../model/Notification.js';
import User from '../model/User.js';
import Role from '../model/Role.js';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin/Manager)
export const createProduct = async (req, res) => {
    try {
        const {
            name, category, sku, barcodeValue, brand,
            costPrice, sellingPrice, reorderLevel, description
        } = req.body;

        // Check if SKU already exists
        const skuExists = await Product.findOne({ sku });
        if (skuExists) {
            return res.status(400).json({ message: 'Product with this SKU already exists.' });
        }

        // If there's an uploaded file, store its path
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const product = await Product.create({
            name, category, sku, barcodeValue, brand,
            costPrice, sellingPrice, reorderLevel, description,
            stock: req.body.stock || 0,
            imageUrl,
            discount: {
                type: req.body.discountType || 'none',
                amount: (req.body.discountType === 'none') ? 0 : (req.body.discountAmount || 0)
            }
        });

        // Notify Managers
        const roles = await Role.find({ roleName: 'Manager' });
        const roleIds = roles.map(r => r._id);
        const usersToNotify = await User.find({ role: { $in: roleIds } });

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'New Product Added',
                message: `Product ${name} (${sku}) has been added to inventory.`,
                type: 'info',
                relatedId: product._id,
                relatedModel: 'Product',
                link: '/admin/inventory',
                actorRole: req.user && req.user.role ? req.user.role.roleName : 'Admin'
            });
            await notif.populate('actor', 'username profilePic');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error creating product', error: error.message });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
    try {
        // Find all products, populate refs, and sort by newest first
        const products = await Product.find({})
            .populate('category', 'name taxRate')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if updating SKU creates a duplicate
        if (req.body.sku && req.body.sku !== product.sku) {
            const skuExists = await Product.findOne({ sku: req.body.sku });
            if (skuExists) {
                return res.status(400).json({ message: 'Product with this SKU already exists.' });
            }
        }

        // Handle image upload if a new image is provided
        let imageUrl = product.imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        // Update fields
        product.name = req.body.name || product.name;
        product.category = req.body.category || product.category;
        product.sku = req.body.sku || product.sku;
        product.barcodeValue = req.body.barcodeValue || product.barcodeValue;
        product.brand = req.body.brand || product.brand;
        product.costPrice = req.body.costPrice || product.costPrice;
        product.sellingPrice = req.body.sellingPrice || product.sellingPrice;
        product.reorderLevel = req.body.reorderLevel || product.reorderLevel;
        product.description = req.body.description !== undefined ? req.body.description : product.description;
        product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
        product.imageUrl = imageUrl;

        // Update discount fields
        if (req.body.discountType || req.body.discountAmount !== undefined) {
            let discType = req.body.discountType || (product.discount?.type || 'none');
            let discAmt = req.body.discountAmount !== undefined ? Number(req.body.discountAmount) : (product.discount?.amount || 0);
            if (discType === 'none') discAmt = 0;
            
            product.discount = {
                type: discType,
                amount: discAmt
            };
        }

        const updatedProduct = await product.save();
        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.json(updatedProduct);

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error updating product' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.deleteOne();
        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.json({ message: 'Product removed' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error deleting product' });
    }
};

// @desc    Adjust product stock
// @route   PUT /api/products/:id/stock
// @access  Private
export const adjustStock = async (req, res) => {
    try {
        const { action, quantity, reason } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!['Add', 'Subtract', 'Set'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Use Add, Subtract, or Set.' });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity cannot be negative.' });
        }

        let newStockLevel = product.stock;

        if (action === 'Add') {
            newStockLevel += quantity;
        } else if (action === 'Subtract') {
            newStockLevel -= quantity;
            if (newStockLevel < 0) newStockLevel = 0; // Prevent negative stock
        } else if (action === 'Set') {
            newStockLevel = quantity;
        }

        const quantityChanged = action === 'Set' ? Math.abs(newStockLevel - product.stock) : quantity;

        // Create log entry
        await InventoryLog.create({
            product: product._id,
            action,
            quantityChanged,
            newStockLevel,
            reason: reason || 'Manual Adjustment',
            adminUser: req.user._id // Assuming protect middleware sets req.user
        });

        // Update product stock
        product.stock = newStockLevel;
        await product.save();

        let currentActorRole = 'Inventory Staff';
        if (req.user && req.user.role) {
            currentActorRole = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
        }

        let rolesToFind = [];
        if (currentActorRole === 'Admin') {
            rolesToFind = ['Manager'];
        } else if (currentActorRole === 'Manager') {
            rolesToFind = ['Admin'];
        } else {
            rolesToFind = ['Admin', 'Manager'];
        }

        const rolesToNotify = await Role.find({ roleName: { $in: rolesToFind } });
        const roleIdsToNotify = rolesToNotify.map(r => r._id);
        const usersToNotify = await User.find({ role: { $in: roleIdsToNotify } });

        for (const user of usersToNotify) {
            const notif = await Notification.create({
                recipient: user._id,
                actor: req.user ? req.user._id : undefined,
                title: 'Inventory Adjusted',
                message: `Stock for ${product.name} was adjusted by ${quantityChanged} units (${action}). Reason: ${reason || 'Manual Adjustment'}`,
                type: 'warning',
                relatedId: product._id,
                relatedModel: 'Product',
                link: '/admin/inventory',
                actorRole: currentActorRole
            });
            await notif.populate('actor', 'username profilePic');
            if (req.io) {
                req.io.to(user._id.toString()).emit('new_notification', notif);
            }
        }

        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.json({ message: 'Stock adjusted successfully', stock: product.stock });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: 'Server error adjusting stock' });
    }
};
