import Sale from '../model/Sale.js';
import Product from '../model/Product.js';
import Invoice from '../model/Invoice.js';

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
