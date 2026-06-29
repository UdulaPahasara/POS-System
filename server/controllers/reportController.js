import Sale from '../model/Sale.js';
import Product from '../model/Product.js';
import Invoice from '../model/Invoice.js';
import Customer from '../model/Customer.js';
import mongoose from 'mongoose';
import { isAdminRole } from '../utils/authUtils.js';

// @desc    Get Dashboard Overview Stats
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Manager)
export const getDashboardStats = async (req, res) => {
    try {
        const { paymentFilter = 'all', branchId } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let branchFilter = {};
        let isAdmin = isAdminRole(req.user);
        if (!isAdmin) {
            if (req.user.branch) branchFilter.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
            branchFilter.branch = new mongoose.Types.ObjectId(branchId);
        }

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Today's Sales
        const todaySales = await Sale.aggregate([
            { $match: { createdAt: { $gte: today }, ...branchFilter } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const todayRevenue = todaySales[0]?.total || 0;

        // 2. Monthly Revenue
        const monthSales = await Sale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, ...branchFilter } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const monthlyRevenue = monthSales[0]?.total || 0;

        // 3. Monthly Profit (Revenue - COGS)
        const monthSalesFull = await Sale.find({ createdAt: { $gte: startOfMonth }, ...branchFilter }).populate('items.product');
        let monthlyCOGS = 0;
        monthSalesFull.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const costPrice = item.product?.costPrice || 0;
                    monthlyCOGS += costPrice * item.quantity;
                });
            }
        });
        const totalProfit = monthlyRevenue - monthlyCOGS;

        // 4. Items in Stock and 7. Low Stock Alerts
        let itemsInStock = 0;
        let lowStockItems = [];

        if (branchFilter.branch) {
            const branchObjectId = branchFilter.branch;
            
            const stockAgg = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $match: { "branchData.branch": branchObjectId } },
                { $group: { _id: null, totalStock: { $sum: '$branchData.stock' } } }
            ]);
            itemsInStock = stockAgg[0]?.totalStock || 0;

            const lowStockRaw = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $match: { "branchData.branch": branchObjectId } },
                { $match: { $expr: { $lte: ['$branchData.stock', '$reorderLevel'] } } },
                { $limit: 5 }
            ]);
            lowStockItems = lowStockRaw.map(p => ({
                name: p.name,
                sku: p.sku || 'N/A',
                stock: p.branchData.stock,
                reorder: p.reorderLevel
            }));
        } else {
            const stockAgg = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $group: { _id: null, totalStock: { $sum: '$branchData.stock' } } }
            ]);
            itemsInStock = stockAgg[0]?.totalStock || 0;

            const lowStockRaw = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $match: { $expr: { $lte: ['$branchData.stock', '$reorderLevel'] } } },
                { $limit: 5 }
            ]);
            lowStockItems = lowStockRaw.map(p => ({
                name: p.name,
                sku: p.sku || 'N/A',
                stock: p.branchData.stock,
                reorder: p.reorderLevel
            }));
        }

        // 5. Revenue Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        const trendSales = await Sale.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, ...branchFilter } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: serverTimezone } },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format for chart (fill missing days)
        const chartLabels = [];
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);

            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${day}`;

            const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });

            chartLabels.push(shortDay);
            const found = trendSales.find(t => t._id === dateStr);
            chartData.push(found ? found.total : 0);
        }

        // 6. Recent Transactions
        const recentTransactionsRaw = await Sale.find(branchFilter).sort({ createdAt: -1 }).limit(5).populate('invoice');
        const recentTransactions = recentTransactionsRaw.map(sale => ({
            id: sale.invoice?.invoiceNumber || sale._id.toString().slice(-6).toUpperCase(),
            customer: sale.customer?.name || 'Walk-in Customer',
            amount: `Rs. ${sale.total.toFixed(2)}`,
            status: 'Completed'
        }));

        // 7. Low Stock Alerts (Already computed above)

        // 8. Top Selling Product (This Month)
        const topSellingAgg = await Sale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, ...branchFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 1 }
        ]);
        
        const topSellingProduct = topSellingAgg.length > 0 
            ? { name: topSellingAgg[0].name, quantity: topSellingAgg[0].totalQuantity } 
            : { name: 'N/A', quantity: 0 };

        // 9. Payment Stats (Cash/Card) based on filter
        let matchCondition = { ...branchFilter };
        if (paymentFilter === 'today') {
            matchCondition.createdAt = { $gte: today };
        } else if (paymentFilter === 'monthly') {
            matchCondition.createdAt = { $gte: startOfMonth };
        }

        const paymentStats = await Sale.aggregate([
            { $match: matchCondition },
            { $group: { 
                _id: null, 
                cashTotal: { $sum: '$cashAmount' },
                cardTotal: { $sum: '$cardAmount' }
            }}
        ]);
        const cashTotal = paymentStats[0]?.cashTotal || 0;
        const cardTotal = paymentStats[0]?.cardTotal || 0;

        res.json({
            todayRevenue,
            monthlyRevenue,
            totalProfit,
            itemsInStock,
            chartData: {
                labels: chartLabels,
                data: chartData
            },
            recentTransactions,
            lowStockItems,
            topSellingProduct,
            cashTotal,
            cardTotal
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// @desc    Get Sales Report Data
// @route   GET /api/reports/sales
// @access  Private (Admin/Manager)
export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, branchId } = req.query;

        let query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let isAdmin = isAdminRole(req.user);

        if (!isAdmin && req.user && req.user.branch) {
            query.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && branchId !== 'global' && mongoose.Types.ObjectId.isValid(branchId)) {
            query.branch = new mongoose.Types.ObjectId(branchId);
        }

        const sales = await Sale.find(query).populate('invoice').populate('payments');

        // Calculate total revenue, total tax, and total savings
        let totalRevenue = 0;
        let totalTax = 0;
        let totalItemsSold = 0;

        sales.forEach(sale => {
            totalRevenue += sale.total;
            totalTax += sale.tax;
            sale.items.forEach(item => {
                totalItemsSold += item.quantity;
            });
        });

        // Group by day for charting
        const salesByDate = {};
        sales.forEach(sale => {
            const dateStr = new Date(sale.createdAt).toISOString().split('T')[0];
            if (!salesByDate[dateStr]) {
                salesByDate[dateStr] = 0;
            }
            salesByDate[dateStr] += sale.total;
        });

        res.json({
            totalRevenue,
            totalTax,
            totalItemsSold,
            totalSales: sales.length,
            salesByDate
        });

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ message: 'Server error generating sales report' });
    }
};

// @desc    Get Inventory Report Data
// @route   GET /api/reports/inventory
// @access  Private (Admin/Manager)
export const getInventoryReport = async (req, res) => {
    try {
        const { branchId } = req.query;
        let products = await Product.find({ isActive: { $ne: false } });
        
        let isAdmin = isAdminRole(req.user);

        let effectiveBranchId = branchId;
        if (!isAdmin && req.user && req.user.branch) {
            effectiveBranchId = req.user.branch.toString();
        }

        if (effectiveBranchId && effectiveBranchId !== 'global') {
            const branchIdStr = effectiveBranchId.toString();
            products = products
                .filter(p => p.branchData.some(b => b.branch && b.branch.toString() === branchIdStr))
                .map(p => {
                    const pObj = p.toObject();
                    const bData = p.branchData.find(b => b.branch && b.branch.toString() === branchIdStr);
                    pObj.stock = bData ? bData.stock : 0;
                    return pObj;
                });
        } else {
            products = products.map(p => {
                const pObj = p.toObject();
                pObj.stock = p.branchData.reduce((acc, b) => acc + (b.stock || 0), 0);
                return pObj;
            });
        }

        let totalStockValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const lowStockItems = [];

        products.forEach(product => {
            totalStockValue += (product.costPrice * product.stock);

            if (product.stock <= 0) {
                outOfStockCount++;
            } else if (product.stock <= product.reorderLevel) {
                lowStockCount++;
                lowStockItems.push({
                    name: product.name,
                    sku: product.sku,
                    stock: product.stock,
                    reorderLevel: product.reorderLevel
                });
            }
        });

        res.json({
            totalProducts: products.length,
            totalStockValue,
            lowStockCount,
            outOfStockCount,
            lowStockItems
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ message: 'Server error generating inventory report' });
    }
};

// @desc    Get Advanced Sales Report (Daily, Weekly, Monthly, Yearly)
// @route   GET /api/reports/sales/advanced
// @access  Private (Admin)
export const getAdvancedSalesReport = async (req, res) => {
    try {
        const { interval = 'daily', branchId } = req.query; // daily, weekly, monthly, yearly

        let format = '%Y-%m-%d';
        if (interval === 'weekly') format = '%Y-%U';
        if (interval === 'monthly') format = '%Y-%m';
        if (interval === 'yearly') format = '%Y';

        let isAdmin = isAdminRole(req.user);

        let matchStage = {};
        if (!isAdmin && req.user && req.user.branch) {
            matchStage.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && branchId !== 'global' && mongoose.Types.ObjectId.isValid(branchId)) {
            matchStage.branch = new mongoose.Types.ObjectId(branchId);
        }

        const sales = await Sale.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format, date: "$createdAt" } },
                    totalRevenue: { $sum: "$total" },
                    totalTax: { $sum: "$tax" },
                    totalSales: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(sales);
    } catch (error) {
        console.error('Error generating advanced sales report:', error);
        res.status(500).json({ message: 'Server error generating advanced sales report' });
    }
};

// @desc    Get Financial Report (Revenue, COGS, Profit)
// @route   GET /api/reports/financial
// @access  Private (Admin)
export const getFinancialReport = async (req, res) => {
    try {
        const { branchId } = req.query;
        
        let isAdmin = isAdminRole(req.user);

        let query = {};
        if (!isAdmin && req.user && req.user.branch) {
            query.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && branchId !== 'global' && mongoose.Types.ObjectId.isValid(branchId)) {
            query.branch = new mongoose.Types.ObjectId(branchId);
        }
        const aggResult = await Sale.aggregate([
            { $match: query },
            { $unwind: "$items" },
            { 
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
            { 
                $group: {
                    _id: "$_id",
                    saleTotal: { $first: "$total" },
                    cogsForSale: { 
                        $sum: { 
                            $multiply: [ { $ifNull: ["$productData.costPrice", 0] }, "$items.quantity" ] 
                        } 
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$saleTotal" },
                    totalCOGS: { $sum: "$cogsForSale" }
                }
            }
        ]);

        const totalRevenue = aggResult.length > 0 ? aggResult[0].totalRevenue : 0;
        const totalCOGS = aggResult.length > 0 ? aggResult[0].totalCOGS : 0;

        const grossProfit = totalRevenue - totalCOGS;

        res.json({
            totalRevenue,
            totalCOGS,
            grossProfit,
            profitMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0
        });
    } catch (error) {
        console.error('Error generating financial report:', error);
        res.status(500).json({ message: 'Server error generating financial report' });
    }
};

// @desc    Get Product Report (Top Selling, Slow Moving)
// @route   GET /api/reports/products
// @access  Private (Admin)
export const getProductReport = async (req, res) => {
    try {
        const { branchId } = req.query;
        
        let isAdmin = isAdminRole(req.user);

        let query = {};
        if (!isAdmin && req.user && req.user.branch) {
            query.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && branchId !== 'global' && mongoose.Types.ObjectId.isValid(branchId)) {
            query.branch = new mongoose.Types.ObjectId(branchId);
        }
        const aggResult = await Sale.aggregate([
            { $match: query },
            { $unwind: "$items" },
            { 
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            { $unwind: "$productData" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$productData.name" },
                    sku: { $first: "$productData.sku" },
                    sellingPrice: { $first: "$productData.sellingPrice" },
                    quantitySold: { $sum: "$items.quantity" }
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    sku: { $ifNull: ["$sku", "N/A"] },
                    quantitySold: 1,
                    revenueGenerated: { $multiply: ["$sellingPrice", "$quantitySold"] }
                }
            },
            { $sort: { quantitySold: -1 } }
        ]);

        const topSelling = aggResult.slice(0, 10);
        const slowMoving = [...aggResult].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 10);

        res.json({
            topSelling,
            slowMoving
        });
    } catch (error) {
        console.error('Error generating product report:', error);
        res.status(500).json({ message: 'Server error generating product report' });
    }
};

// @desc    Get Customer Report
// @route   GET /api/reports/customers
// @access  Private (Admin)
export const getCustomerReport = async (req, res) => {
    try {
        const { branchId } = req.query;
        let query = { "customer.name": { $exists: true, $ne: null } };
        
        let isAdmin = isAdminRole(req.user);

        if (!isAdmin && req.user && req.user.branch) {
            query.branch = new mongoose.Types.ObjectId(req.user.branch);
        } else if (branchId && branchId !== 'global' && mongoose.Types.ObjectId.isValid(branchId)) {
            query.branch = new mongoose.Types.ObjectId(branchId);
        }

        const allCustomers = await Customer.find({});
        const sales = await Sale.find(query);

        const customerStats = {};

        // Initialize all registered customers
        allCustomers.forEach(c => {
            const cid = c.phone || c.email || c.name;
            customerStats[cid] = {
                id: cid,
                name: c.name,
                email: c.email || 'N/A',
                phone: c.phone || 'N/A',
                totalPurchases: 0,
                totalSpent: 0
            };
        });

        // Add sales data
        sales.forEach(sale => {
            if (sale.customer && sale.customer.name) {
                const cid = sale.customer.phone || sale.customer.email || sale.customer.name;
                if (!customerStats[cid]) {
                    customerStats[cid] = {
                        id: cid,
                        name: sale.customer.name,
                        email: sale.customer.email || 'N/A',
                        phone: sale.customer.phone || 'N/A',
                        totalPurchases: 0,
                        totalSpent: 0
                    };
                }
                customerStats[cid].totalPurchases += 1;
                customerStats[cid].totalSpent += sale.total;
            }
        });

        const topCustomers = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent || a.name.localeCompare(b.name));

        res.json({
            topCustomers
        });
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({ message: 'Server error generating customer report' });
    }
};
