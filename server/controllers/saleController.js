import Sale from '../model/Sale.js';
import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';
import Invoice from '../model/Invoice.js';
import Payment from '../model/Payment.js';
import Customer from '../model/Customer.js';
import LoyaltyTransaction from '../model/LoyaltyTransaction.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import Notification from '../model/Notification.js';

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private (Admin/Cashier)
export const createSale = async (req, res) => {
    try {
        const { cartItems, paymentMethod, amountPaid, customer: customerData, pointsRedeemed = 0, orderDiscountPercent = 0 } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        // Verify and calculate server-side
        let calculatedSubtotal = 0;
        let calculatedTax = 0;
        const processedItems = [];

        for (const item of cartItems) {
            const product = await Product.findById(item.product._id).populate('category', 'taxRate');
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product.name} not found` });
            }

            // Check stock, allow negative but log warning (as approved)
            if (product.stock < item.quantity) {
                console.warn(`[Stock Warning] Product ${product.name} is low on stock (${product.stock}). Sale proceeded.`);
            }

            // Check if stock will drop below reorder level
            const willBeLowStock = (product.stock - item.quantity) <= product.reorderLevel;
            const wasLowStock = product.stock <= product.reorderLevel;

            // Deduct stock
            product.stock -= item.quantity;
            await product.save();

            // Record audit log
            await InventoryLog.create({
                product: product._id,
                action: 'Subtract',
                quantityChanged: item.quantity,
                newStockLevel: product.stock,
                reason: 'Sale Completed',
                adminUser: req.user._id
            });

            // Trigger notification if it just dropped below reorder level (prevent spam if it was already low)
            if (willBeLowStock && !wasLowStock) {
                const adminManagerRoles = await Role.find({ roleName: { $in: ['Admin', 'Manager', 'Inventory Staff'] } });
                const adminManagerRoleIds = adminManagerRoles.map(r => r._id);
                const usersToNotify = await User.find({ role: { $in: adminManagerRoleIds } });

                for (const user of usersToNotify) {
                    const notif = await Notification.create({
                        recipient: user._id,
                        actor: req.user._id,
                        title: 'Low Stock Alert',
                        message: `Product "${product.name}" dropped below reorder level (${product.stock} remaining).`,
                        type: product.stock <= 0 ? 'error' : 'warning',
                        relatedId: product._id,
                        relatedModel: 'Product',
                        link: '/admin/products'
                    });
                    await notif.populate('actor', 'username profilePic');
                    if (req.io) {
                        req.io.to(user._id.toString()).emit('new_notification', notif);
                    }
                }
            }

            // Discount calculation logic
            const price = Number(product.sellingPrice);
            let discountedPrice = price;
            let discountObj = undefined;

            if (product.discount && product.discount.amount > 0) {
                const type = product.discount.type || 'fixed';
                const amt = Number(product.discount.amount || 0);
                discountObj = { type, amount: amt };

                if (type === 'percentage') {
                    discountedPrice = price * (1 - amt / 100);
                } else {
                    discountedPrice = Math.max(0, price - amt);
                }
            }

            const itemSubtotal = discountedPrice * item.quantity;
            calculatedSubtotal += itemSubtotal;

            const itemTaxRate = product.category && product.category.taxRate ? product.category.taxRate / 100 : 0;
            const itemTax = itemSubtotal * itemTaxRate;
            calculatedTax += itemTax;

            processedItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                sellingPrice: price,
                discount: discountObj,
                discountedPrice: discountedPrice,
                subtotal: itemSubtotal,
                tax: itemTax
            });
        }

        const tax = calculatedTax;
        const total = calculatedSubtotal + tax;

        // Apply Order-Level Discount
        const orderDiscountPercentNum = Number(orderDiscountPercent) || 0;
        const orderDiscountAmount = total * (orderDiscountPercentNum / 100);
        let finalTotal = Math.max(0, total - orderDiscountAmount);

        // Apply Loyalty Points Discount
        let pointsToRedeem = Number(pointsRedeemed);
        let customerRecord = null;

        if (customerData && customerData._id) {
            customerRecord = await Customer.findById(customerData._id);
            if (customerRecord) {
                const currentPoints = customerRecord.loyaltyPoints || 0;
                if (pointsToRedeem > currentPoints) {
                    return res.status(400).json({ message: 'Not enough loyalty points' });
                }
                const pointsDiscountAmount = pointsToRedeem;
                finalTotal = Math.max(0, finalTotal - pointsDiscountAmount);
            } else {
                pointsToRedeem = 0; // Invalid customer ID
            }
        } else {
            pointsToRedeem = 0; // Cannot redeem without customer
        }

        // Calculate points earned (1 point per 1000 LKR spent)
        let pointsEarned = 0;
        if (customerRecord) {
            pointsEarned = Math.floor(finalTotal / 1000);
        }

        // Determine change
        const change = paymentMethod === 'Cash' ? Number(Math.max(0, amountPaid - finalTotal).toFixed(2)) : 0;
        
        finalTotal = Number(finalTotal.toFixed(2));
        
        const cashAmount = paymentMethod === 'Cash' ? finalTotal : 0;
        const cardAmount = paymentMethod === 'Card' ? finalTotal : 0;

        let sale = new Sale({
            cashier: req.user._id, // Assuming authMiddleware sets req.user
            customer: customerData ? {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone
            } : undefined,
            items: processedItems,
            subtotal: calculatedSubtotal,
            tax,
            total: finalTotal,
            orderDiscountPercent: orderDiscountPercentNum,
            orderDiscountAmount: orderDiscountAmount,
            cashAmount,
            cardAmount,
            pointsEarned,
            pointsRedeemed: pointsToRedeem
        });

        const createdSale = await sale.save();

        // Generate Auto-incrementing Invoice Number (e.g. 0000000000001)
        const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        let nextInvoiceNum = 1;
        
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const match = lastInvoice.invoiceNumber.match(/\d+$/);
            if (match) {
                nextInvoiceNum = parseInt(match[0], 10) + 1;
            }
        }
        const invoiceNumberStr = nextInvoiceNum.toString().padStart(13, '0');

        // Create Invoice
        const invoice = new Invoice({
            invoiceNumber: invoiceNumberStr,
            total: finalTotal,
            sale: createdSale._id
        });
        await invoice.save();

        // Create Payment
        const payment = new Payment({
            amount: paymentMethod === 'Card' ? finalTotal : amountPaid,
            paymentMethod: paymentMethod,
            change: change,
            sale: createdSale._id
        });
        await payment.save();

        // Handle Loyalty Transaction
        if (customerRecord && (pointsEarned > 0 || pointsToRedeem > 0)) {
            const loyaltyTx = new LoyaltyTransaction({
                customer: customerRecord._id,
                sale: createdSale._id,
                pointsEarned,
                pointsRedeemed: pointsToRedeem
            });
            await loyaltyTx.save();

            // Update customer balance
            const currentPoints = customerRecord.loyaltyPoints || 0;
            customerRecord.loyaltyPoints = currentPoints - pointsToRedeem + pointsEarned;
            customerRecord.totalRedeemedPoints = (customerRecord.totalRedeemedPoints || 0) + pointsToRedeem;
            await customerRecord.save();
        }

        // Update Sale with refs
        createdSale.invoice = invoice._id;
        createdSale.payments = [payment._id];
        await createdSale.save();

        // Fetch populated sale
        const populatedSale = await Sale.findById(createdSale._id)
            .populate('invoice')
            .populate('payments');

        if (req.io) {
            req.io.emit('data_updated', { type: 'SALE' });
            req.io.emit('data_updated', { type: 'PRODUCT' });
        }
        res.status(201).json(populatedSale);

    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: `Server error creating sale: ${error.message}` });
    }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (Admin)
export const getSales = async (req, res) => {
    try {
        const sales = await Sale.find({})
            .populate('cashier', 'username name email')
            .populate('invoice')
            .populate('payments')
            .sort({ createdAt: -1 });
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Server error fetching sales' });
    }
};

// @desc    Get sales by customer ID
// @route   GET /api/sales/customer/:customerId
// @access  Private (Admin/Manager/Cashier)
export const getSalesByCustomer = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        
        const mongoose = await import('mongoose');
        const Customer = mongoose.model('Customer');
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const sales = await Sale.find({ 'customer.phone': customer.phone })
            .populate('cashier', 'name username email')
            .populate('items.product', 'name category')
            .populate('payments')
            .sort({ createdAt: -1 });

        // Format sales to include invoice numbers
        const Invoice = mongoose.model('Invoice');
        const formattedSales = await Promise.all(sales.map(async (sale) => {
            const invoice = await Invoice.findOne({ sale: sale._id });
            return {
                ...sale.toObject(),
                invoiceNumber: invoice ? invoice.invoiceNumber : 'N/A',
                issueDate: invoice ? invoice.issueDate : sale.createdAt
            };
        }));

        res.json(formattedSales);
    } catch (error) {
        console.error('Error fetching customer sales:', error);
        res.status(500).json({ message: 'Server error fetching customer sales' });
    }
};
