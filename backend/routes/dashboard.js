const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDashboardStats, getUserSessions } = require('../controllers/dashboardController');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

// Get user's sessions
router.get('/sessions', authenticateToken, getUserSessions);

module.exports = router;
