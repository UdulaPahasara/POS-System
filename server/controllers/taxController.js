import Tax from '../model/Tax.js';

// @desc    Get all taxes
// @route   GET /api/taxes
// @access  Private
export const getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.find({}).sort({ createdAt: -1 });
        res.json(taxes);
    } catch (error) {
        console.error('Error fetching taxes:', error);
        res.status(500).json({ message: 'Server error fetching taxes' });
    }
};

// @desc    Create a tax rate
// @route   POST /api/taxes
// @access  Private (Admin/Manager)
export const createTax = async (req, res) => {
    try {
        const { taxName, rate } = req.body;
        
        const taxExists = await Tax.findOne({ taxName });
        if (taxExists) {
            return res.status(400).json({ message: 'Tax name already exists' });
        }

        const tax = await Tax.create({ taxName, rate });
        if (req.io) req.io.emit('data_updated', { type: 'TAX' });
        res.status(201).json(tax);
    } catch (error) {
        console.error('Error creating tax:', error);
        res.status(500).json({ message: 'Server error creating tax' });
    }
};

// @desc    Update a tax rate
// @route   PUT /api/taxes/:id
// @access  Private (Admin/Manager)
export const updateTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ message: 'Tax not found' });
        }

        // Check for duplicate name if name is changed
        if (req.body.taxName && req.body.taxName !== tax.taxName) {
            const exists = await Tax.findOne({ taxName: req.body.taxName });
            if (exists) {
                return res.status(400).json({ message: 'Tax name already exists' });
            }
        }

        tax.taxName = req.body.taxName || tax.taxName;
        tax.rate = req.body.rate !== undefined ? req.body.rate : tax.rate;

        const updatedTax = await tax.save();
        if (req.io) req.io.emit('data_updated', { type: 'TAX' });
        res.json(updatedTax);
    } catch (error) {
        console.error('Error updating tax:', error);
        res.status(500).json({ message: 'Server error updating tax' });
    }
};

// @desc    Delete a tax rate
// @route   DELETE /api/taxes/:id
// @access  Private (Admin)
export const deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ message: 'Tax not found' });
        }

        await tax.deleteOne();
        if (req.io) req.io.emit('data_updated', { type: 'TAX' });
        res.json({ message: 'Tax removed' });
    } catch (error) {
        console.error('Error deleting tax:', error);
        res.status(500).json({ message: 'Server error deleting tax' });
    }
};
