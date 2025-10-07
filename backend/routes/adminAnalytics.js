const express = require('express');
const { query } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  getDashboardAnalytics,
  getSignupTrends,
  getSessionAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getUserDemographics,
  getSessionPerformance
} = require('../controllers/adminAnalyticsController');

const router = express.Router();

// Validation rules
const periodValidation = [
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
];

// Routes
router.get('/dashboard', getDashboardAnalytics);
router.get('/signup-trends', periodValidation, getSignupTrends);
router.get('/sessions', getSessionAnalytics);
router.get('/users', getUserAnalytics);
router.get('/revenue', periodValidation, getRevenueAnalytics);
router.get('/user-demographics', getUserDemographics);
router.get('/session-performance', getSessionPerformance);

module.exports = router;
