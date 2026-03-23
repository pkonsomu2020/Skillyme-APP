const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/fileUpload');
const { submissionLimiter } = require('../middleware/rateLimiting');
const {
  getAllAssignments,
  getAssignmentById,
  submitAssignment,
  getUserSubmissions,
  getUserPoints,
  getLeaderboard
} = require('../controllers/assignmentController');

const router = express.Router();

// Public routes (no auth required)
router.get('/', getAllAssignments);
router.get('/leaderboard', getLeaderboard);

// Protected static-path routes MUST come before /:id to avoid param collision
router.get('/user/submissions', authenticateToken, getUserSubmissions);
router.get('/user/points', authenticateToken, getUserPoints);

// Dynamic param routes
router.get('/:id', getAssignmentById);
router.post('/:id/submit', authenticateToken, submissionLimiter, upload.array('files', 10), handleMulterError, submitAssignment);

module.exports = router;