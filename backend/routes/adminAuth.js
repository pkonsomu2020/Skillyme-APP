const express = require('express');
const { body } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { login, getProfile, updateProfile } = require('../controllers/adminAuthController');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
];

// Routes
router.post('/login', loginValidation, login);
router.get('/profile', authenticateAdmin, getProfile);
router.put('/profile', authenticateAdmin, updateProfileValidation, updateProfile);

module.exports = router;
