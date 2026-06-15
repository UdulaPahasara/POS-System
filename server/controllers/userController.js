import User from '../model/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Exclude password from results
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res) => {
    try {
        const { username, email, password, phone, role, status } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            phone,
            role: role || 'Cashier',
            status: status || 'Active'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            });
        } else {
            res.status(400).json({ message: 'Invalid user data received' });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.role = req.body.role || user.role;
        user.status = req.body.status || user.status;

        // Only update password if a new one was provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed completely' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};
