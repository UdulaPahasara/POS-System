import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../model/User.js';

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 2. Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Generate JWT Token
        // If Remember Me is checked, token lasts 30 days. Otherwise, standard 1 day session.
        const expiresIn = rememberMe ? '30d' : '1d';
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login" });
    }
};
