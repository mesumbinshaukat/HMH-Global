const loginUser = async (req, res) => {
    let { email, password} = req.body;
    email = email.trim().toLowerCase(); // Ensure lowercase and trimmed
    console.log('[UserController] loginUser called. email:', email);
    try {
        const user = await User.findOne({ email });
        console.log('[UserController] loginUser found user:', user);
        if (!user) return res.status(401).json({ message: 'Invalid email' });

        // Allow admin login even if email not verified
        if (!user.emailVerified && user.role !== 'admin') return res.status(401).json({ message: 'Please verify your email first' });

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

        // Send login notification email (non-blocking, fire and forget)
        setImmediate(async () => {
            try {
                await Promise.race([
                    transporter.sendMail({
                        from: `"HMH Global" <${process.env.SMTP_USER}>`,
                        to: user.email,
                        subject: "New Login Alert",
                        html: `<p>Hello ${user.name},</p><p>You just logged in from a new device.</p>`
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000))
                ]);
            } catch (emailError) {
                console.warn('[UserController] Login email notification failed:', emailError.message);
            }
        });

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
