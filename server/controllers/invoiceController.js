import Invoice from '../model/Invoice.js';
import { isAdminRole } from '../utils/authUtils.js';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin/Manager)
export const getInvoices = async (req, res) => {
    try {
        let branchId = req.user.branch;
        let isAdmin = isAdminRole(req.user);

        if (isAdmin) {
            if (req.query.branchId === 'global') {
                branchId = null; // fetch all
            } else if (req.query.branchId && req.query.branchId !== 'undefined') {
                branchId = req.query.branchId;
            }
        }

        const query = {};
        if (branchId) {
            query.branch = branchId;
        }


        const invoices = await Invoice.find(query)
            .populate('branch', 'name')
            .populate({
                path: 'sale',
                populate: [
                    { path: 'cashier', select: 'name username email' },
                    { path: 'payments' },
                    { path: 'items.product', select: 'name category' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices' });
    }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: 'sale',
                populate: [
                    { path: 'cashier', select: 'name username email' },
                    { path: 'payments' },
                    { path: 'items.product', select: 'name category' }
                ]
            });
            
        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error fetching invoice' });
    }
};
