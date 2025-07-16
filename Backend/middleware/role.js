const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            console.log(`[ROLE] Access denied for user ${req.user.userId} (${userRole}) on ${req.method} ${req.originalUrl}`);
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        console.log(`[ROLE] Access granted for user ${req.user.userId} (${userRole}) on ${req.method} ${req.originalUrl}`);
        next();
    };
};

module.exports = checkRole;