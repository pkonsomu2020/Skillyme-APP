const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllSessions, getSessionById, getUserSessions } = require('../controllers/sessionController');

// Get all sessions (public endpoint)
router.get('/', getAllSessions);

// Get session by ID (public endpoint)
router.get('/:id', getSessionById);

// Get user's enrolled sessions (protected endpoint)
router.get('/user/enrolled', authenticateToken, getUserSessions);

module.exports = router;
