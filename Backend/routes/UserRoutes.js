const express = require('express');
const router = express.Router();
const {
    createUser,
    loginUser,
    verifyEmail,
    getProfile,
    updateUser,
    forgotPassword,
    resetPassword,
    showAllUsers
} = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public routes
router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/all-users', authMiddleware, roleMiddleware('admin'), showAllUsers);
router.get('/profile', authMiddleware, getProfile);
router.put('/update', authMiddleware, updateUser);

module.exports = router;