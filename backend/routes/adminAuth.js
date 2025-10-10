const express = require('express');
const { body } = require('express-validator');
const { 
  authenticateAdmin, 
  simpleAuth, 
  ultraSimpleAuth, 
  cleanAuth 
} = require('../middleware/adminAuth');
const { 
  login, 
  getProfile, 
  updateProfile,
  simpleLogin,
  ultraSimpleLogin,
  cleanLogin
} = require('../controllers/adminAuthController');

const router = express.Router();

// ========================================
// VALIDATION RULES
// ========================================

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
];

// ========================================
// MAIN ADMIN AUTHENTICATION ROUTES
// ========================================

// Main admin login (FIXED - removed strict validation)
router.post('/login', login);

// Admin profile routes (protected with clean auth)
router.get('/profile', cleanAuth, getProfile);
router.put('/profile', cleanAuth, updateProfileValidation, updateProfile);

// ========================================
// ALTERNATIVE AUTHENTICATION ROUTES
// ========================================

// Simple authentication routes (bypasses CSRF)
router.post('/simple-login', simpleLogin);
router.get('/simple-profile', simpleAuth, getProfile);

// Ultra simple authentication routes (bypasses CSRF)
router.post('/ultra-simple-login', ultraSimpleLogin);
router.get('/ultra-simple-profile', ultraSimpleAuth, getProfile);

// Clean authentication routes (bypasses CSRF)
router.post('/clean-login', cleanLogin);
router.get('/clean-profile', cleanAuth, getProfile);



// ========================================
// EXPORTS
// ========================================

module.exports = router;