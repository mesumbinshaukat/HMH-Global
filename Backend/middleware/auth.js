const { account } = require('../config/appwrite');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
    try {
        const sessionId = req.headers.authorization?.replace('Bearer ', '');
        
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Set the session for the current request
        const client = req.app.locals.client;
        client.setSession(sessionId);

        // Get current user to verify session
        const user = await account.get();
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Middleware to check if user is admin
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please authenticate first.'
            });
        }

        if (roles.length && !roles.includes(req.user.prefs?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
