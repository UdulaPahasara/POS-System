import Sale from '../model/Sale.js';
import Product from '../model/Product.js';
import Invoice from '../model/Invoice.js';
import Customer from '../model/Customer.js';

// @desc    Get Dashboard Overview Stats
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Manager)
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // 1. Today's Sales
        const todaySales = await Sale.aggregate([
            { $match: { createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const todayRevenue = todaySales[0]?.total || 0;

        // 2. Monthly Revenue
        const monthSales = await Sale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const monthlyRevenue = monthSales[0]?.total || 0;

        // 3. Monthly Profit (Revenue - COGS)
        const monthSalesFull = await Sale.find({ createdAt: { $gte: startOfMonth } }).populate('items.product');
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

        // 4. Items in Stock
        const stockAgg = await Product.aggregate([
            { $group: { _id: null, totalStock: { $sum: '$stock' } } }
        ]);
        const itemsInStock = stockAgg[0]?.totalStock || 0;

        // 5. Revenue Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0,0,0,0);
        
        const trendSales = await Sale.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                total: { $sum: "$total" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Format for chart (fill missing days)
        const chartLabels = [];
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            chartLabels.push(shortDay);
            const found = trendSales.find(t => t._id === dateStr);
            chartData.push(found ? found.total : 0);
        }

        // 6. Recent Transactions
        const recentTransactionsRaw = await Sale.find().sort({ createdAt: -1 }).limit(5).populate('invoice');
        const recentTransactions = recentTransactionsRaw.map(sale => ({
            id: sale.invoice?.invoiceNumber || sale._id.toString().slice(-6).toUpperCase(),
            customer: sale.customer?.name || 'Walk-in Customer',
            amount: `Rs. ${sale.total.toFixed(2)}`,
            status: 'Completed' 
        }));

        // 7. Low Stock Alerts
        const lowStockRaw = await Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } }).limit(5);
        const lowStockItems = lowStockRaw.map(p => ({
            name: p.name,
            sku: p.sku || 'N/A',
            stock: p.stock,
            reorder: p.reorderLevel
        }));

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
            lowStockItems
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
        const { startDate, endDate } = req.query;
        
        let query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
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
        const products = await Product.find({});
        
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
        const { interval = 'daily' } = req.query; // daily, weekly, monthly, yearly
        
        let format = '%Y-%m-%d';
        if (interval === 'weekly') format = '%Y-%U';
        if (interval === 'monthly') format = '%Y-%m';
        if (interval === 'yearly') format = '%Y';

        const sales = await Sale.aggregate([
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
        const sales = await Sale.find({}).populate('items.product');

        let totalRevenue = 0;
        let totalCOGS = 0; 

        sales.forEach(sale => {
            totalRevenue += sale.total;
            sale.items.forEach(item => {
                if (item.product && item.product.costPrice) {
                    totalCOGS += (item.product.costPrice * item.quantity);
                }
            });
        });

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
        const sales = await Sale.find({}).populate('items.product');
        
        const productStats = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.product) {
                    const pid = item.product._id.toString();
                    if (!productStats[pid]) {
                        productStats[pid] = {
                            id: item.product._id,
                            name: item.product.name,
                            sku: item.product.sku,
                            quantitySold: 0,
                            revenueGenerated: 0
                        };
                    }
                    productStats[pid].quantitySold += item.quantity;
                    productStats[pid].revenueGenerated += (item.product.sellingPrice * item.quantity);
                }
            });
        });

        const productsArray = Object.values(productStats);
        
        const topSelling = [...productsArray].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
        const slowMoving = [...productsArray].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 10);

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
        const sales = await Sale.find({ "customer.name": { $exists: true, $ne: null } });
        
        const customerStats = {};
        
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

        const topCustomers = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

        res.json({
            topCustomers
        });
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({ message: 'Server error generating customer report' });
    }
};
