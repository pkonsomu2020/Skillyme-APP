const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { submitMpesaCode } = require('../controllers/paymentController');

const router = express.Router();

// Validation rules
const submitMpesaCodeValidation = [
  body('sessionId').optional().isInt({ min: 1 }).withMessage('Valid session ID is required'),
  body('fullMpesaMessage').trim().isLength({ min: 10 }).withMessage('M-Pesa message is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount is required')
];

// Routes
router.post('/submit-mpesa', authenticateToken, submitMpesaCodeValidation, submitMpesaCode);

module.exports = router;