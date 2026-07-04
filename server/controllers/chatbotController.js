import { GoogleGenAI } from '@google/genai';
import Product from '../model/Product.js';
import Sale from '../model/Sale.js';
import Customer from '../model/Customer.js';

// @desc    Chat with AI Assistant
// @route   POST /api/chat
// @access  Private
export const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // ─── Date anchors ───────────────────────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        // ─── Role / branch detection ─────────────────────────────────────────────
        const roleName = req.user.role ? (req.user.role.roleName || req.user.role) : null;
        const isAdminOrManager = roleName === 'Admin' || roleName === 'Manager' || roleName === 'Super Admin';
        const isAdmin = roleName === 'Admin' || roleName === 'Super Admin';

        // Cashiers / Inventory Staff and Managers are scoped to their branch; Admins see global data
        const branchId = isAdmin ? null : req.user.branch;
        const branchIdStr = branchId
            ? (branchId._id ? branchId._id.toString() : branchId.toString())
            : null;

        // Build Mongoose match clause for branch-scoped queries
        const branchMatch = branchIdStr ? { branch: branchId } : {};

        // ─── 1. Basic counts ─────────────────────────────────────────────────────
        const productCount = await Product.countDocuments({ isActive: { $ne: false } });
        const customerCount = await Customer.countDocuments();

        // ─── 2. Today's sales ────────────────────────────────────────────────────
        const todaysSales = await Sale.find({ createdAt: { $gte: today }, ...branchMatch });
        const todaysRevenue = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
        const todaysSaleCount = todaysSales.length;

        // ─── 3. Monthly revenue ──────────────────────────────────────────────────
        let monthlyRevenue = 0;
        let monthlyProfit = 0;

        if (isAdminOrManager) {
            const monthSalesAgg = await Sale.aggregate([
                { $match: { createdAt: { $gte: startOfMonth }, ...branchMatch } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            monthlyRevenue = monthSalesAgg[0]?.total || 0;

            // Monthly COGS & Profit
            const monthSalesFull = await Sale.find({ createdAt: { $gte: startOfMonth }, ...branchMatch }).populate('items.product');
            let monthlyCOGS = 0;
            monthSalesFull.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const costPrice = item.product?.costPrice || 0;
                        monthlyCOGS += costPrice * item.quantity;
                    });
                }
            });
            monthlyProfit = monthlyRevenue - monthlyCOGS;
        }

        // ─── 4. 7-day revenue trend ──────────────────────────────────────────────
        let revenueTrendInfo = 'No trend data available.';

        if (isAdminOrManager) {
            const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

            const trendSales = await Sale.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo }, ...branchMatch } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: serverTimezone } },
                        total: { $sum: '$total' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const trendParts = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(sevenDaysAgo);
                d.setDate(d.getDate() + i);

                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

                const found = trendSales.find(t => t._id === dateStr);
                trendParts.push(`  ${dayLabel}: LKR ${(found ? found.total : 0).toFixed(2)}`);
            }
            revenueTrendInfo = trendParts.join('\n');
        }

        // ─── 5. Top & slowest selling products (this month) ──────────────────────
        const productSalesAgg = await Sale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, ...branchMatch } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalSold: -1 } }
        ]);

        let topProductsMonthInfo = 'No sales data this month.';
        let slowestProductsMonthInfo = 'No sales data this month.';

        if (productSalesAgg.length > 0) {
            const top3 = productSalesAgg.slice(0, 3);
            topProductsMonthInfo = top3.map((p, i) => `  ${i + 1}. ${p._id} (${p.totalSold} units)`).join('\n');

            const bottom3 = [...productSalesAgg].reverse().slice(0, 3);
            slowestProductsMonthInfo = bottom3.map((p, i) => `  ${i + 1}. ${p._id} (${p.totalSold} units)`).join('\n');
        }

        // ─── 6. All-time top selling products ────────────────────────────────────
        const topProductAllTimeAgg = await Sale.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 3 }
        ]);

        let topProductsAllTimeInfo = 'No sales data yet.';
        if (topProductAllTimeAgg.length > 0) {
            topProductsAllTimeInfo = topProductAllTimeAgg.map((p, i) => `  ${i + 1}. ${p._id} (${p.totalSold} units sold)`).join('\n');
        }

        // ─── 7. Cash / card payment totals ───────────────────────────────────────
        let cashCardInfo = '';

        if (isAdminOrManager) {
            const paymentStats = await Sale.aggregate([
                { $match: branchMatch },
                {
                    $group: {
                        _id: null,
                        cashTotal: { $sum: '$cashAmount' },
                        cardTotal: { $sum: '$cardAmount' }
                    }
                }
            ]);
            const cashTotal = paymentStats[0]?.cashTotal || 0;
            const cardTotal = paymentStats[0]?.cardTotal || 0;

            cashCardInfo = `
Payment Method Breakdown (All Time):
- Cash Payments Total: LKR ${cashTotal.toFixed(2)}
- Card Payments Total: LKR ${cardTotal.toFixed(2)}`;
        }

        // ─── 8. Recent transactions (last 5) ─────────────────────────────────────
        let recentTransactionsInfo = 'No recent transactions.';

        if (isAdminOrManager) {
            const recentSalesRaw = await Sale.find(branchMatch)
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('invoice');

            if (recentSalesRaw.length > 0) {
                recentTransactionsInfo = recentSalesRaw.map(sale => {
                    const invoiceNo = sale.invoice?.invoiceNumber || sale._id.toString().slice(-6).toUpperCase();
                    const customerName = sale.customer?.name || 'Walk-in Customer';
                    const amount = sale.total.toFixed(2);
                    const date = new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `  - Invoice #${invoiceNo} | ${customerName} | LKR ${amount} | ${date}`;
                }).join('\n');
            }
        }

        // ─── 9. Product stock data ────────────────────────────────────────────────
        let lowStockInfo = 'No items are currently low on stock.';
        let productListInfo = 'No products found.';
        
        // Fetch products for general list
        const allProductsRaw = await Product.find({ isActive: { $ne: false } }).populate('branchData.branch').limit(200);

        const productsWithStock = allProductsRaw.map(p => {
            let pStock = 0;
            let pPrice = p.sellingPrice || 0;
            if (branchIdStr) {
                const bData = p.branchData.find(b => {
                    if (!b.branch) return false;
                    const bIdStr = b.branch._id ? b.branch._id.toString() : b.branch.toString();
                    return bIdStr === branchIdStr;
                });
                if (bData) {
                    pStock = bData.stock || 0;
                    pPrice = bData.sellingPrice || pPrice;
                }
            } else {
                pStock = p.branchData.reduce((acc, b) => acc + (b.stock || 0), 0);
            }
            return { name: p.name, stock: pStock, price: pPrice };
        });

        productListInfo = productsWithStock.map(p => `  - ${p.name} (Price: LKR ${p.price}, Total Stock: ${p.stock})`).join('\n');

        // Low stock calculation (matching the dashboard's logic exactly)
        let lowStockRaw = [];
        if (isAdmin) {
            lowStockRaw = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $match: { $expr: { $lte: ['$branchData.stock', '$reorderLevel'] } } },
                {
                    $lookup: {
                        from: "branches",
                        localField: "branchData.branch",
                        foreignField: "_id",
                        as: "branchDetails"
                    }
                },
                { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },
                { $limit: 20 }
            ]);
        } else {
            lowStockRaw = await Product.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $unwind: "$branchData" },
                { $match: { "branchData.branch": branchId } },
                { $match: { $expr: { $lte: ['$branchData.stock', '$reorderLevel'] } } },
                {
                    $lookup: {
                        from: "branches",
                        localField: "branchData.branch",
                        foreignField: "_id",
                        as: "branchDetails"
                    }
                },
                { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },
                { $limit: 10 }
            ]);
        }

        if (lowStockRaw.length > 0) {
            lowStockInfo = lowStockRaw.map(p => {
                const branchName = p.branchDetails ? p.branchDetails.name : 'Unknown Branch';
                return `  - ${p.name} (Low in ${branchName}: ${p.branchData.stock} stock, Reorder at: ${p.reorderLevel})`;
            }).join('\n');
        }

        // ─── 10. Build system prompt ──────────────────────────────────────────────
        const adminManagerSection = isAdminOrManager ? `
━━━ FINANCIAL OVERVIEW (Admin / Manager) ━━━
Monthly Revenue (This Month): LKR ${monthlyRevenue.toFixed(2)}
Monthly Profit (After COGS): LKR ${monthlyProfit.toFixed(2)}
${cashCardInfo}

Revenue Trend — Last 7 Days:
${revenueTrendInfo}

Top Selling Products (This Month):
${topProductsMonthInfo}

Slowest Selling Products (This Month):
${slowestProductsMonthInfo}

Recent Transactions (Last 5):
${recentTransactionsInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : '';

        const systemInstruction = `
You are a helpful, professional, and knowledgeable AI assistant for a Point of Sale (POS) system.
You are speaking directly to a ${roleName || 'staff member'}.

Here is the current real-time data from the POS database:

━━━ GENERAL STATS ━━━
Total Active Products: ${productCount}
Total Registered Customers: ${customerCount}
Today's Revenue: LKR ${todaysRevenue.toFixed(2)}
Number of Sales Today: ${todaysSaleCount}

Top Selling Products (All Time):
${topProductsAllTimeInfo}

Low Stock Alerts:
${lowStockInfo}

Full Product List (Name, Price, Stock):
${productListInfo}
${adminManagerSection}

━━━ INSTRUCTIONS ━━━
- Keep answers concise, helpful, and directly related to the POS system.
- Use the exact data above when answering. Do NOT make up or estimate figures.
- For today's revenue or sales count, use the "General Stats" section.
- For monthly revenue, profit, trends, or payment breakdown, use the "Financial Overview" section (only available to Admin/Manager).
- If a cashier or inventory staff member asks about financial details you don't have access to for their role, politely inform them that this information is available to managers and administrators.
- If asked for a product list, provide the full list from "Full Product List".
- If asked about low stock items, list them from "Low Stock Alerts".
- If asked about the best or worst selling products this month, use the "Top/Slowest Selling Products (This Month)" data.
- If asked about recent transactions, list them from "Recent Transactions".
- If asked about cash vs card payments, use "Payment Method Breakdown".
- Format responses using simple markdown (bold, bullet lists) for readability.
`;

        // ─── 11. Format history for Gemini ───────────────────────────────────────
        let contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                // Skip the hardcoded welcome message (must not start with model turn)
                if (msg.role === 'model' && msg.parts[0].text.includes('POS Assistant')) {
                    return;
                }
                if (msg.role && msg.parts) {
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.parts[0].text }]
                    });
                }
            });
        }

        // Add current user message
        contents.push({ role: 'user', parts: [{ text: message }] });

        // ─── 12. Call Gemini API ──────────────────────────────────────────────────
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing. Did you restart the server after adding it to .env?');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            }
        });

        const reply = response.text;
        res.status(200).json({ reply });

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ message: error.message || 'Server error while communicating with AI.' });
    }
};
