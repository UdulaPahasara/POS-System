import Sale from '../model/Sale.js';
import Product from '../model/Product.js';
import InventoryLog from '../model/InventoryLog.js';
import Invoice from '../model/Invoice.js';
import Payment from '../model/Payment.js';
import Customer from '../model/Customer.js';
import LoyaltyTransaction from '../model/LoyaltyTransaction.js';

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private (Admin/Cashier)
export const createSale = async (req, res) => {
    try {
        const { cartItems, paymentMethod, amountPaid, customer: customerData, pointsRedeemed = 0 } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        // Verify and calculate server-side
        let calculatedSubtotal = 0;
        const processedItems = [];

        for (const item of cartItems) {
            const product = await Product.findById(item.product._id);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product.name} not found` });
            }

            // Check stock, allow negative but log warning (as approved)
            if (product.stock < item.quantity) {
                console.warn(`[Stock Warning] Product ${product.name} is low on stock (${product.stock}). Sale proceeded.`);
            }

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

            processedItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                sellingPrice: price,
                discount: discountObj,
                discountedPrice: discountedPrice,
                subtotal: itemSubtotal
            });
        }

        const taxRate = 0.10; // 10%
        const tax = calculatedSubtotal * taxRate;
        const total = calculatedSubtotal + tax;

        // Apply Loyalty Points Discount
        let finalTotal = total;
        let pointsToRedeem = Number(pointsRedeemed);
        let customerRecord = null;

        if (customerData && customerData._id) {
            customerRecord = await Customer.findById(customerData._id);
            if (customerRecord) {
                const currentPoints = customerRecord.loyaltyPoints || 0;
                if (pointsToRedeem > currentPoints) {
                    return res.status(400).json({ message: 'Not enough loyalty points' });
                }
                const discountAmount = pointsToRedeem * 100;
                finalTotal = Math.max(0, total - discountAmount);
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
            pointsEarned,
            pointsRedeemed: pointsToRedeem
        });

        const createdSale = await sale.save();

        // Create Invoice
        const invoice = new Invoice({
            invoiceNumber: `INV-${Date.now()}`,
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
