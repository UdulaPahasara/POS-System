import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../model/User.js';
import { sendEmailJS } from '../utils/sendEmail.js';

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // 1. Check if user exists and populate role
        const user = await User.findOne({ email }).populate({
            path: 'role',
            populate: { path: 'permissions' }
        });
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

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expire to 15 minutes
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Create reset URL
        // In a real app, you might want to configure this URL via env var
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        try {
            await sendEmailJS({
                to_email: user.email,
                to_name: user.username,
                reset_link: resetUrl
            });

            res.status(200).json({ message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            console.error("EMAILJS ERROR DETAILS:", error);
            return res.status(500).json({ message: error.message || "Email could not be sent" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
