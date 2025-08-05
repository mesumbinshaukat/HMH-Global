const express = require('express');
const router = express.Router();
const { createContact, getContacts } = require('../controllers/ContactController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// @route   POST /api/contact
// @desc    Create a new contact message
// @access  Public
router.post('/', createContact);

// @route   GET /api/contact
// @desc    Get all contact messages (Admin only)
// @access  Private (Admin)
router.get('/', auth, checkRole('admin'), getContacts);

module.exports = router;
