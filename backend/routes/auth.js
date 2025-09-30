const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { forgotPassword, validateResetToken, resetPassword } = require('../controllers/passwordResetController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('country').trim().isLength({ min: 2 }).withMessage('Country is required'),
  body('county').optional().trim().isLength({ min: 2 }).withMessage('County must be at least 2 characters'),
  body('field_of_study').optional().trim().isLength({ min: 2 }).withMessage('Field of study must be at least 2 characters'),
  body('institution').optional().trim().isLength({ min: 2 }).withMessage('Institution must be at least 2 characters'),
  body('level_of_study').optional().isIn(['High School', 'Undergraduate', 'Graduate', 'Postgraduate']).withMessage('Invalid level of study')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('country').optional().trim().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('county').optional().trim().isLength({ min: 2 }).withMessage('County must be at least 2 characters')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;