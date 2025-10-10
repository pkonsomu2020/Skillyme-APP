const express = require('express');
const { body, param } = require('express-validator');
const { cleanAuth } = require('../middleware/adminAuth');
const {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  bulkUpdatePayments
} = require('../controllers/adminPaymentController');

const router = express.Router();

// Validation rules
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid payment ID is required')
];

const statusValidation = [
  body('status').isIn(['pending', 'paid', 'failed', 'amount_mismatch']).withMessage('Invalid payment status'),
  body('admin_notes').optional().isString().isLength({ max: 1000 }).withMessage('Admin notes must be less than 1000 characters')
];

const bulkUpdateValidation = [
  body('payment_ids').isArray({ min: 1 }).withMessage('payment_ids must be a non-empty array'),
  body('payment_ids.*').isInt({ min: 1 }).withMessage('Each payment ID must be a valid integer'),
  body('status').isIn(['pending', 'paid', 'failed', 'amount_mismatch']).withMessage('Invalid payment status'),
  body('admin_notes').optional().isString().isLength({ max: 1000 }).withMessage('Admin notes must be less than 1000 characters')
];

// Routes (all protected with clean admin authentication)
router.get('/', cleanAuth, getAllPayments);
router.get('/stats', cleanAuth, getPaymentStats);
router.post('/bulk-update', cleanAuth, bulkUpdateValidation, bulkUpdatePayments);
router.get('/:id', cleanAuth, idValidation, getPaymentById);
router.put('/:id/status', cleanAuth, idValidation, statusValidation, updatePaymentStatus);

module.exports = router;