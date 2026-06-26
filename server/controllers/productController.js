import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';
import Notification from '../model/Notification.js';
import User from '../model/User.js';
import Role from '../model/Role.js';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
    try {
        const {
            name, category, sku, barcodeValue, brand,
            costPrice, sellingPrice, reorderLevel, description
        } = req.body;

        let skuExists = await Product.findOne({ sku });
        if (skuExists) {
            // Product already exists in global catalog. Let's merge the branch data to add it to the new branch.
            let newBranchData = [];
            if (req.body.branchData) {
                newBranchData = JSON.parse(req.body.branchData);
            } else if (req.user.branch) {
                newBranchData.push({
                    branch: req.user.branch,
                    sellingPrice: sellingPrice,
                    stock: req.body.stock || 0,
                    reservedStock: 0,
                    damagedStock: 0
                });
            }

            let wasUpdated = false;
            newBranchData.forEach(newB => {
                const bIdx = skuExists.branchData.findIndex(b => b.branch.toString() === newB.branch.toString());
                if (bIdx >= 0) {
                    // Update existing branch data
                    skuExists.branchData[bIdx].sellingPrice = newB.sellingPrice;
                    skuExists.branchData[bIdx].stock = newB.stock;
                    wasUpdated = true;
                } else {
                    // Add to new branch
                    skuExists.branchData.push(newB);
                    wasUpdated = true;
                }
            });

            if (wasUpdated) {
                await skuExists.save();
                if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
                return res.status(200).json(skuExists);
            } else {
                return res.status(400).json({ message: 'Product with this SKU already exists and no new branch data provided.' });
            }
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        let branchData = [];
        if (req.body.branchData) {
            branchData = JSON.parse(req.body.branchData);
        } else if (req.user.branch) {
            branchData.push({
                branch: req.user.branch,
                sellingPrice: sellingPrice,
                stock: req.body.stock || 0,
                reservedStock: 0,
                damagedStock: 0
            });
        }

        const product = await Product.create({
            name, category, sku, barcodeValue, brand,
            costPrice, sellingPrice, reorderLevel, description,
            stock: req.body.stock || 0, // Legacy fallback
            imageUrl,
            discount: {
                type: req.body.discountType || 'none',
                amount: (req.body.discountType === 'none') ? 0 : (req.body.discountAmount || 0)
            },
            branchData
        });

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
        let products = await Product.find({ isActive: { $ne: false } })
            .populate('category', 'name taxRate')
            .populate('branchData.branch', 'name')
            .sort({ createdAt: -1 });

        let branchId = req.user.branch;
        let isAdmin = false;
        if (req.user && req.user.role) {
            const roleName = typeof req.user.role === 'object' ? req.user.role.roleName : req.user.role;
            if (roleName === 'Admin' || roleName === 'Super Admin') isAdmin = true;
        }

        // Allow any role to request the global catalog if explicitly requested
        if (req.query.branchId === 'global') {
            branchId = null;
        } else if (isAdmin) {
            if (!req.query.branchId) {
                branchId = null; // explicitly global for admins if not specified
            } else if (req.query.branchId) {
                branchId = req.query.branchId;
            }
        }

        if (branchId) {
            const branchIdStr = branchId._id ? branchId._id.toString() : branchId.toString();
            // Only return products that have a branchData entry for this branch
            products = products
                .filter(p => p.branchData.some(b => {
                    if (!b.branch) return false;
                    return b.branch._id
                        ? b.branch._id.toString() === branchIdStr
                        : b.branch.toString() === branchIdStr;
                }))
                .map(p => {
                    const pObj = p.toObject();
                    const bData = p.branchData.find(b => b.branch && (
                        b.branch._id
                            ? b.branch._id.toString() === branchIdStr
                            : b.branch.toString() === branchIdStr
                    ));
                    if (bData) {
                        pObj.sellingPrice = bData.sellingPrice;
                        pObj.stock = bData.stock;
                        pObj.reservedStock = bData.reservedStock;
                        pObj.damagedStock = bData.damagedStock;
                    }
                    return pObj;
                });
        } else {
            // Global view: sum stock across all branches
            products = products.map(p => {
                const pObj = p.toObject();
                pObj.stock = p.branchData.reduce((acc, b) => acc + (b.stock || 0), 0);
                pObj.reservedStock = p.branchData.reduce((acc, b) => acc + (b.reservedStock || 0), 0);
                pObj.damagedStock = p.branchData.reduce((acc, b) => acc + (b.damagedStock || 0), 0);
                return pObj;
            });
        }
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

        if (req.body.sku && req.body.sku !== product.sku) {
            const skuExists = await Product.findOne({ sku: req.body.sku });
            if (skuExists) {
                return res.status(400).json({ message: 'Product with this SKU already exists.' });
            }
        }

        let imageUrl = product.imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        // Update global fields
        product.name = req.body.name || product.name;
        product.category = req.body.category || product.category;
        product.sku = req.body.sku || product.sku;
        product.barcodeValue = req.body.barcodeValue || product.barcodeValue;
        product.brand = req.body.brand || product.brand;
        product.costPrice = req.body.costPrice || product.costPrice;
        product.reorderLevel = req.body.reorderLevel || product.reorderLevel;
        product.description = req.body.description !== undefined ? req.body.description : product.description;
        product.imageUrl = imageUrl;

        // Update branch-specific fields
        if (req.body.branchData) {
            product.branchData = JSON.parse(req.body.branchData);
        } else if (req.user.branch) {
            const bDataIndex = product.branchData.findIndex(b => b.branch.toString() === req.user.branch.toString());
            if (bDataIndex >= 0) {
                if (req.body.sellingPrice !== undefined) product.branchData[bDataIndex].sellingPrice = req.body.sellingPrice;
                if (req.body.stock !== undefined) product.branchData[bDataIndex].stock = req.body.stock;
            } else {
                product.branchData.push({
                    branch: req.user.branch,
                    sellingPrice: req.body.sellingPrice || product.sellingPrice,
                    stock: req.body.stock || 0
                });
            }
        } else {
            // Admin updating global fallback
            if (req.body.sellingPrice !== undefined) product.sellingPrice = req.body.sellingPrice;
            if (req.body.stock !== undefined) product.stock = req.body.stock;
        }

        if (req.body.discountType || req.body.discountAmount !== undefined) {
            let discType = req.body.discountType || (product.discount?.type || 'none');
            let discAmt = req.body.discountAmount !== undefined ? Number(req.body.discountAmount) : (product.discount?.amount || 0);
            if (discType === 'none') discAmt = 0;
            product.discount = { type: discType, amount: discAmt };
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

        const branchId = req.query.branchId;

        if (branchId && branchId !== 'global') {
            // Branch-specific delete: remove only this branch's entry from branchData
            const before = product.branchData.length;
            product.branchData = product.branchData.filter(b => {
                if (!b.branch) return true; // keep entries without a branch ref (safety)
                const bId = b.branch._id ? b.branch._id.toString() : b.branch.toString();
                return bId !== branchId.toString();
            });

            if (product.branchData.length === before) {
                return res.status(404).json({ message: 'Product not found in this branch' });
            }

            // If no branches remain, soft delete the whole product
            if (product.branchData.length === 0) {
                product.isActive = false;
                await product.save();
                if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
                return res.json({ message: 'Product removed from branch and softly deleted (no branches remain)' });
            }

            await product.save();
            if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
            return res.json({ message: 'Product removed from branch successfully' });
        }

        // No branchId: full soft delete (global admin action)
        product.isActive = false;
        await product.save();
        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.json({ message: 'Product softly removed' });
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
        const branchId = req.user.branch;

        if (!branchId) {
            return res.status(400).json({ message: 'User must be assigned to a branch to adjust stock.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!['Add', 'Subtract', 'Set'].includes(action) || quantity < 0) {
            return res.status(400).json({ message: 'Invalid action or negative quantity.' });
        }

        const branchIdStr = branchId._id ? branchId._id.toString() : branchId.toString();
        let bDataIndex = product.branchData.findIndex(b => {
            const bIdStr = b.branch._id ? b.branch._id.toString() : b.branch.toString();
            return bIdStr === branchIdStr;
        });
        if (bDataIndex === -1) {
            product.branchData.push({ branch: branchId, sellingPrice: product.sellingPrice, stock: 0 });
            bDataIndex = product.branchData.length - 1;
        }

        let currentStock = product.branchData[bDataIndex].stock;
        let newStockLevel = currentStock;

        if (action === 'Add') {
            newStockLevel += quantity;
        } else if (action === 'Subtract') {
            newStockLevel -= quantity;
            if (newStockLevel < 0) newStockLevel = 0;
        } else if (action === 'Set') {
            newStockLevel = quantity;
        }

        const quantityChanged = action === 'Set' ? Math.abs(newStockLevel - currentStock) : quantity;

        await InventoryLog.create({
            product: product._id,
            branch: branchId,
            action,
            quantityChanged,
            newStockLevel,
            reason: reason || 'Manual Adjustment',
            adminUser: req.user._id
        });

        product.branchData[bDataIndex].stock = newStockLevel;
        await product.save();

        if (req.io) req.io.emit('data_updated', { type: 'PRODUCT' });
        res.json({ message: 'Stock adjusted successfully', stock: newStockLevel });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: 'Server error adjusting stock' });
    }
};
