const User = require('../models/User');
const bcryptjs = require("bcryptjs");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOSTNAME,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER.replace(/'/g, ""),
        pass: process.env.SMTP_PASS.replace(/'/g, "")
    }
});

const createUser = async (req, res) => {
    try {
        const { name, email, password, role} = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ message: "Email already in use" });

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[cC][oO][mM]$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters and contain letters and numbers" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            emailVerified: false,
            role
        });

        await newUser.save();

        const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        await transporter.sendMail({
            from: `"SmartDine" <${process.env.SMTP_USER.replace(/'/g, "")}>`,
            to: newUser.email,
            subject: "Action Required: Confirm Your Email",
            text: `Hello ${newUser.name}, please verify your email by visiting: ${verifyLink}`,
            html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Verify Your Email</title>
    </head>
    <body>
      <h2>Hello ${newUser.name},</h2>
      <p>Thanks for signing up for HMH Global. Please verify your email within 24 hours by clicking the link below:</p>
      <a href="${verifyLink}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verifyLink}</p>
    </body>
    </html>            
            `
        });

        res.status(201).json({ message: "User created. Please verify your email." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        // console.log(token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decoded);
        const user = await User.findById(decoded.userId);
        // console.log(user);

        if (!user) return res.status(404).json({ message: "Invalid verification link" });

        user.emailVerified = true;
        user.expireAt = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
};

const loginUser = async (req, res) => {
    const { email, password} = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email' });

        if (!user.emailVerified) return res.status(401).json({ message: 'Please verify your email first' });

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

        await transporter.sendMail({
            from: `"HMH Global" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: "New Login Alert",
            html: `<p>Hello ${user.name},</p><p>You just logged in from a new device.</p>`
        });

        res.json({
            message: "Login successful",
            token,
            user: {
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, profilePicture } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (name) user.name = name;
        if (profilePicture) user.profilePicture = profilePicture;

        user.updatedAt = Date.now();

        await user.save();

        res.json({
            message: "User updated successfully",
            user: {
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const showAllUsers = async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find().select("-password"); // Exclude pass

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOSTNAME,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER.replace(/'/g, ""), // Remove quotes if present
                pass: process.env.SMTP_PASS.replace(/'/g, ""),
            },
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: `"HMH Global" <${process.env.SMTP_USER.replace(/'/g, "")}>`,
            to: user.email,
            subject: "Reset Your Password",
            html: `
                <h3>Hello ${user.name},</h3>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
            `,
        });

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "Invalid or expired token" });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({ message: "Invalid or expired token" });
    }
};

module.exports = {
    createUser,
    loginUser,
    verifyEmail,
    getProfile,
    updateUser,
    showAllUsers,
    forgotPassword,
    resetPassword
};