const User = require('../models/User');
const bcryptjs = require("bcryptjs");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const createUser = async (req, res) => {
    console.log('[UserController] createUser called. body:', req.body);
    try {
        let { name, email, password, role} = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        email = email.trim().toLowerCase(); // Ensure lowercase and trimmed

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ message: "Email already in use" });

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters and contain letters and numbers" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const isAdmin = role === 'admin';
        const newUser = new User({
            name,
            email, // Already lowercased
            password: hashedPassword,
            // TEMP: Disable email verification site-wide per request
            emailVerified: true,
            role
        });

        await newUser.save();
        // TEMP: Skipping verification email per request. TODO: Re-enable when ready.

        // Split name into firstName and lastName
        const [firstName, ...rest] = (newUser.name || '').split(' ');
        const lastName = rest.join(' ');
        res.status(201).json({ 
            message: isAdmin ? "Admin user created." : "Account created successfully.",
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: firstName || newUser.name,
                lastName: lastName || '',
                role: newUser.role,
                profilePicture: newUser.profilePicture,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
                isEmailVerified: newUser.emailVerified
            }
        });

    } catch (error) {
        console.error('[UserController] createUser error:', error);
        res.status(500).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    // TODO: Remove this function when email verification is disabled
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
    let { email, password} = req.body;
    email = email.trim().toLowerCase(); // Ensure lowercase and trimmed
    console.log('[UserController] loginUser called. email:', email);
    try {
        const user = await User.findOne({ email });
        console.log('[UserController] loginUser found user:', user);
        if (!user) return res.status(401).json({ message: 'Invalid email' });

        // TEMP: Email verification disabled globally. Do not block login based on emailVerified.

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

        // Send login notification email (non-blocking, fail-safe)
        try {
            const port = Number(process.env.SMTP_PORT || 465);
            const secure = port === 465; // true for 465, false for 587/25
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOSTNAME,
                port,
                secure,
                auth: {
                    user: (process.env.SMTP_USER || '').replace(/'/g, ''),
                    pass: (process.env.SMTP_PASS || '').replace(/'/g, ''),
                },
            });
            await transporter.sendMail({
                from: `"HMH Global" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "New Login Alert",
                html: `<p>Hello ${user.name},</p><p>You just logged in from a new device.</p>`,
            });
        } catch (emailError) {
            console.warn('[UserController] Login email notification failed (non-fatal):', emailError.message);
            // Continue with login process even if email fails
        }

        // Split name into firstName and lastName
        const [firstName, ...rest] = (user.name || '').split(' ');
        const lastName = rest.join(' ');

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: firstName || user.name,
                    lastName: lastName || '',
                    role: user.role,
                    profilePicture: user.profilePicture,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    isEmailVerified: user.emailVerified
                }
            }
        });
    } catch (error) {
        console.error('[UserController] loginUser error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const [firstName, ...rest] = (user.name || '').split(' ');
        const lastName = rest.join(' ');
        res.json({
            id: user._id,
            email: user.email,
            firstName: firstName || user.name,
            lastName: lastName || '',
            role: user.role,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isEmailVerified: user.emailVerified
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
        const [firstName, ...rest] = (user.name || '').split(' ');
        const lastName = rest.join(' ');
        res.json({
            message: "User updated successfully",
            user: {
                id: user._id,
                email: user.email,
                firstName: firstName || user.name,
                lastName: lastName || '',
                role: user.role,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                isEmailVerified: user.emailVerified
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