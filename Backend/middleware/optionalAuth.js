const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    userId: decoded.userId,
                    role: decoded.role,
                };
                console.log(`[OPTIONAL_AUTH] Authenticated user ${decoded.userId} (${decoded.role}) for ${req.method} ${req.originalUrl}`);
            } catch (err) {
                console.log(`[OPTIONAL_AUTH] Invalid or expired token for ${req.method} ${req.originalUrl}, proceeding as guest`);
                req.user = null;
            }
        } else {
            console.log(`[OPTIONAL_AUTH] No token provided for ${req.method} ${req.originalUrl}, proceeding as guest`);
            req.user = null;
        }
        
        next();
    } catch (error) {
        console.log(`[OPTIONAL_AUTH] Error in optional auth middleware: ${error.message}`);
        req.user = null;
        next();
    }
};

module.exports = optionalAuth;
