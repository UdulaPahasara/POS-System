import Discount from '../model/Discount.js';

// @desc    Get all active discounts
// @route   GET /api/discounts
// @access  Admin
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({ isActive: true });
    res.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new discount
// @route   POST /api/discounts
// @access  Admin
export const createDiscount = async (req, res) => {
  const { name, type, amount } = req.body;
  if (!name || !type || amount == null) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const discount = await Discount.create({ name, type, amount });
    res.status(201).json(discount);
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an existing discount
// @route   PUT /api/discounts/:id
// @access  Admin
export const updateDiscount = async (req, res) => {
  const { id } = req.params;
  const { name, type, amount, isActive } = req.body;
  try {
    const discount = await Discount.findByIdAndUpdate(
      id,
      { name, type, amount, isActive },
      { new: true, runValidators: true }
    );
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    res.json(discount);
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft‑delete (deactivate) a discount
// @route   DELETE /api/discounts/:id
// @access  Admin
export const deleteDiscount = async (req, res) => {
  const { id } = req.params;
  try {
    const discount = await Discount.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    res.json({ message: 'Discount deactivated' });
  } catch (error) {
    console.error('Error deactivating discount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
