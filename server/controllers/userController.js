import User from '../model/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('role', 'roleName');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

            if (req.body.password) {
                if (!req.body.currentPassword) {
                    return res.status(400).json({ message: 'Please provide current password to change password.' });
                }
                const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Current password is incorrect.' });
                }
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
            const populatedUser = await User.findById(updatedUser._id).select('-password').populate('role', 'roleName');
            
            if (req.io) req.io.emit('data_updated', { type: 'USER' });
            
            res.json(populatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').populate('role', 'roleName'); // Exclude password, populate role
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

        // Ensure role is an ObjectId by looking up the roleName
        let roleId = null;
        const mongoose = await import('mongoose');
        const Role = mongoose.model('Role');

        if (role) {
            const foundRole = await Role.findOne({ roleName: role });
            if (foundRole) roleId = foundRole._id;
        }

        if (!roleId) {
            const defaultRole = await Role.findOne({ roleName: 'Cashier' });
            roleId = defaultRole ? defaultRole._id : null;
        }

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
            role: roleId,
            status: status || 'Active'
        });

        if (user) {
            if (req.io) req.io.emit('data_updated', { type: 'USER' });
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
        
        if (req.body.role) {
            const mongoose = await import('mongoose');
            const Role = mongoose.model('Role');
            const foundRole = await Role.findOne({ roleName: req.body.role });
            if (foundRole) {
                user.role = foundRole._id;
            }
        }
        
        user.status = req.body.status || user.status;

        // Only update password if a new one was provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        if (req.io) req.io.emit('data_updated', { type: 'USER' });

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
        if (req.io) req.io.emit('data_updated', { type: 'USER' });
        res.json({ message: 'User removed completely' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};
