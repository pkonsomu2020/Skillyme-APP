const express = require('express');
const router = express.Router();
const { getAllSessions, getSessionById } = require('../controllers/sessionController');

// Get all sessions (public endpoint)
router.get('/', getAllSessions);

// Get session by ID (public endpoint)
router.get('/:id', getSessionById);

module.exports = router;
