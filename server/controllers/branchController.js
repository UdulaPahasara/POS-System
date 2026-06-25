import Branch from '../model/Branch.js';

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private
export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find({}).sort({ name: 1 });
        res.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ message: 'Server error fetching branches' });
    }
};

// @desc    Create a branch
// @route   POST /api/branches
// @access  Private (Admin)
export const createBranch = async (req, res) => {
    try {
        const { name, address, phone, email, status } = req.body;
        
        const branchExists = await Branch.findOne({ name });
        if (branchExists) {
            return res.status(400).json({ message: 'Branch with this name already exists' });
        }

        const branch = await Branch.create({ name, address, phone, email, status });
        
        if (req.io) req.io.emit('data_updated', { type: 'BRANCH' });
        res.status(201).json(branch);
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ message: 'Server error creating branch' });
    }
};

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private (Admin)
export const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        branch.name = req.body.name || branch.name;
        branch.address = req.body.address || branch.address;
        branch.phone = req.body.phone !== undefined ? req.body.phone : branch.phone;
        branch.email = req.body.email !== undefined ? req.body.email : branch.email;
        branch.status = req.body.status || branch.status;

        const updatedBranch = await branch.save();
        
        if (req.io) req.io.emit('data_updated', { type: 'BRANCH' });
        res.json(updatedBranch);
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ message: 'Server error updating branch' });
    }
};

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin)
export const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        
        // Don't delete Main Branch to prevent breaking old records safely
        if (branch.name === 'Main Branch') {
            return res.status(400).json({ message: 'Cannot delete the default Main Branch' });
        }

        await branch.deleteOne();
        
        if (req.io) req.io.emit('data_updated', { type: 'BRANCH' });
        res.json({ message: 'Branch removed' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ message: 'Server error deleting branch' });
    }
};
