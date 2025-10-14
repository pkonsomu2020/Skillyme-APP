const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { forgotPassword, validateResetToken, resetPassword } = require('../controllers/passwordResetController');

const router = express.Router();

// Validation rules matching CSV structure exactly
const registerValidation = [
  // Required fields
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().isLength({ min: 5, max: 50 }).withMessage('Phone number must be 5-50 characters'),
  body('country').trim().isLength({ min: 2, max: 100 }).withMessage('Country must be 2-100 characters'),
  
  // Optional fields with proper validation
  body('county').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('County must be max 100 characters'),
  body('field_of_study').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Field of study must be max 255 characters'),
  body('institution').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Institution must be max 255 characters'),
  body('level_of_study').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Level of study must be max 100 characters'),
  
  // Enhanced fields (all optional)
  body('preferred_name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Preferred name must be max 100 characters'),
  body('date_of_birth').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
  body('course_of_study').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Course of study must be max 255 characters'),
  body('degree').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Degree must be max 100 characters'),
  body('year_of_study').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Year of study must be max 50 characters'),
  body('primary_field_interest').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Primary field interest must be max 255 characters'),
  body('signup_source').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Signup source must be max 100 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('country').optional().trim().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('county').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('County must be at least 2 characters')
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