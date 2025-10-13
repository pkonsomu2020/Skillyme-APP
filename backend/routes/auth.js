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
  body('phone').trim().isLength({ min: 5 }).withMessage('Phone number is required'),
  body('country').trim().isLength({ min: 2 }).withMessage('Country is required'),
  body('county').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('County must be at least 2 characters'),
  body('field_of_study').trim().isLength({ min: 1 }).withMessage('Field of study is required'),
  body('institution').optional().trim().isLength({ min: 1 }).withMessage('Institution is required'),
  body('level_of_study').isIn(['High School', 'Undergraduate', 'Graduate', 'Postgraduate']).withMessage('Invalid level of study'),
  // Enhanced signup field validations (all optional)
  body('preferred_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Preferred name must be 1-100 characters'),
  body('date_of_birth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
  body('course_of_study').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Course of study must be 1-255 characters'),
  body('degree').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Degree must be 1-100 characters'),
  body('year_of_study').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Year of study must be 1-50 characters'),
  body('primary_field_interest').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Primary field interest must be 1-255 characters'),
  body('signup_source').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Signup source must be 1-100 characters')
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