const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            console.log(`[AUTH] Missing or malformed token for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: 'Authorization token missing or malformed' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                role: decoded.role,
            };
            console.log(`[AUTH] Authenticated user ${decoded.userId} (${decoded.role}) for ${req.method} ${req.originalUrl}`);
            next();
        } catch (err) {
            console.log(`[AUTH] Invalid or expired token for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = auth;