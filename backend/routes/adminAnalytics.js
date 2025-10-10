const express = require('express');
const { query } = require('express-validator');
const { authenticateAdmin, cleanAuth } = require('../middleware/adminAuth');
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

// Routes (protected with clean authentication)
router.get('/dashboard', cleanAuth, getDashboardAnalytics);
router.get('/signup-trends', cleanAuth, periodValidation, getSignupTrends);
router.get('/sessions', cleanAuth, getSessionAnalytics);
router.get('/users', cleanAuth, getUserAnalytics);
router.get('/revenue', cleanAuth, periodValidation, getRevenueAnalytics);
router.get('/user-demographics', cleanAuth, getUserDemographics);
router.get('/session-performance', cleanAuth, getSessionPerformance);

module.exports = router;
