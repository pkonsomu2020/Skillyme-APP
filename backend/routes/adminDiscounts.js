const express = require('express');
const { body, query } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  getLeaderboardForDiscounts,
  awardDiscount,
  getAllDiscounts,
  bulkAwardDiscounts
} = require('../controllers/adminDiscountController');

const router = express.Router();

// Validation rules
const awardDiscountValidation = [
  body('user_id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('discount_percentage').isInt({ min: 1, max: 100 }).withMessage('Discount percentage must be between 1 and 100'),
  body('discount_type').optional().isIn(['next_phase', 'premium_services', 'general']).withMessage('Valid discount type is required'),
  body('valid_until').optional().isISO8601().withMessage('Valid date is required for expiry'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
];

const bulkAwardValidation = [
  body('top_count').optional().isInt({ min: 1, max: 100 }).withMessage('Top count must be between 1 and 100'),
  body('discount_percentage').isInt({ min: 1, max: 100 }).withMessage('Discount percentage must be between 1 and 100'),
  body('discount_type').optional().isIn(['next_phase', 'premium_services', 'general']).withMessage('Valid discount type is required'),
  body('min_points').optional().isInt({ min: 0 }).withMessage('Minimum points must be a positive number'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['all', 'active', 'used', 'expired', 'revoked']).withMessage('Valid status is required'),
  query('discount_type').optional().isIn(['all', 'next_phase', 'premium_services', 'general']).withMessage('Valid discount type is required')
];

const leaderboardValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('period').optional().isIn(['all', 'weekly', 'monthly']).withMessage('Valid period is required'),
  query('target_group').optional().isIn(['all', 'form4', 'undergraduate']).withMessage('Valid target group is required'),
  query('min_points').optional().isInt({ min: 0 }).withMessage('Minimum points must be a positive number')
];

// Routes
router.get('/leaderboard', authenticateAdmin, leaderboardValidation, getLeaderboardForDiscounts);
router.post('/award', authenticateAdmin, awardDiscountValidation, awardDiscount);
router.post('/bulk-award', authenticateAdmin, bulkAwardValidation, bulkAwardDiscounts);
router.get('/', authenticateAdmin, paginationValidation, getAllDiscounts);

module.exports = router;