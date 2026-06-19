import Category from '../model/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin/Manager)
export const createCategory = async (req, res) => {
    try {
        const { name, description, taxRate } = req.body;
        
        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({ name, description, taxRate: taxRate || 0 });
        if (req.io) req.io.emit('data_updated', { type: 'CATEGORY' });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error creating category' });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Manager)
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check for duplicate name if name is changed
        if (req.body.name && req.body.name !== category.name) {
            const exists = await Category.findOne({ name: req.body.name });
            if (exists) {
                return res.status(400).json({ message: 'Category name already exists' });
            }
        }

        category.name = req.body.name || category.name;
        category.description = req.body.description !== undefined ? req.body.description : category.description;
        category.taxRate = req.body.taxRate !== undefined ? req.body.taxRate : category.taxRate;

        const updatedCategory = await category.save();
        if (req.io) req.io.emit('data_updated', { type: 'CATEGORY' });
        res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.deleteOne();
        if (req.io) req.io.emit('data_updated', { type: 'CATEGORY' });
        res.json({ message: 'Category removed' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
};
