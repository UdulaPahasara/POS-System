import { GoogleGenAI } from '@google/genai';
import Product from '../model/Product.js';
import Sale from '../model/Sale.js';
import Customer from '../model/Customer.js';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Chat with AI Assistant
// @route   POST /api/chat
// @access  Private
export const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // 1. Gather quick context from the POS database to inject into the AI's prompt
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const roleName = req.user.role ? (req.user.role.roleName || req.user.role) : null;
        const isAdmin = roleName === 'Admin' || roleName === 'Super Admin';
        const branchId = isAdmin ? null : req.user.branch;
        const branchIdStr = branchId ? (branchId._id ? branchId._id.toString() : branchId.toString()) : null;

        // Fetch basic stats
        const productCount = await Product.countDocuments({ isActive: { $ne: false } });
        const customerCount = await Customer.countDocuments();
        
        // Fetch today's sales
        let saleMatch = { createdAt: { $gte: today } };
        if (branchIdStr) saleMatch.branch = branchId;
        const todaysSales = await Sale.find(saleMatch);
        const todaysRevenue = todaysSales.reduce((acc, sale) => acc + sale.total, 0);

        // Fetch top selling products (Global)
        const topProductAgg = await Sale.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.name", totalSold: { $sum: "$items.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 3 }
        ]);

        let topProductsInfo = "No sales data yet.";
        if (topProductAgg.length > 0) {
            topProductsInfo = topProductAgg.map((p, i) => `${i + 1}. ${p._id} (${p.totalSold} units sold)`).join('\n');
        }

        // Fetch all products to calculate branch-specific stock
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
            return { name: p.name, stock: pStock, price: pPrice, reorderLevel: p.reorderLevel };
        });

        // Format low stock items for the prompt
        const lowStockProducts = productsWithStock.filter(p => p.stock <= p.reorderLevel);
        const lowStockInfo = lowStockProducts.length > 0 
            ? lowStockProducts.map(p => `- ${p.name} (Stock: ${p.stock}, Reorder at: ${p.reorderLevel})`).join('\n')
            : 'No items are currently low on stock.';

        // Fetch all product details for general inquiries
        const productListInfo = productsWithStock.map(p => `- ${p.name} (Price: LKR ${p.price}, Stock: ${p.stock})`).join('\n');

        // 2. Create the System Prompt
        const systemInstruction = `
You are a helpful, professional, and knowledgeable AI assistant for a Point of Sale (POS) system. 
You are speaking directly to a staff member (like a cashier, manager, or admin). 

Here is the current real-time data from the POS database to help you answer questions:
- Total Products in Database: ${productCount}
- Total Customers in Database: ${customerCount}
- Today's Revenue: LKR ${todaysRevenue.toFixed(2)}
- Number of Sales Today: ${todaysSales.length}

Top Selling Products (All-Time):
${topProductsInfo}

Low Stock Alerts:
${lowStockInfo}

Full Product List (Name, Price, Stock):
${productListInfo}

Instructions for you:
- Keep your answers concise, helpful, and directly related to the POS system.
- If asked about today's revenue or sales, use the data provided above.
- If asked about top selling products, low stock items, or specific product details (like price), use the data above.
- If the user asks for a list of products, you MUST provide the full list from the 'Full Product List' data above. Do not claim you cannot list them.
- If asked about low stock items, list them clearly from the data above.
- Do NOT make up fake product names or fake data. If you don't know the answer, politely say so.
- Format your responses using simple markdown (bolding, lists) to make it easy to read.
`;

        // 3. Format history for Gemini
        let contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                // Gemini API requires the conversation to start with a 'user' role.
                // We must skip the hardcoded "Hi there! I'm your POS Assistant..." welcome message.
                if (msg.role === 'model' && msg.parts[0].text.includes("POS Assistant")) {
                    return; 
                }
                if (msg.role && msg.parts) {
                    contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts[0].text }] });
                }
            });
        }
        
        // Add the current user message
        contents.push({ role: 'user', parts: [{ text: message }] });

        // Check if API key is loaded
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing. Did you restart the server after adding it to .env?");
        }

        // 4. Call the Gemini API
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
