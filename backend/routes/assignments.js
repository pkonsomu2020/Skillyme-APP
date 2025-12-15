const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  getAllAssignments,
  getAssignmentById,
  submitAssignment,
  getUserSubmissions,
  getUserPoints,
  getLeaderboard
} = require('../controllers/assignmentController');

const router = express.Router();

// Validation rules
const submissionValidation = [
  body('submission_text').optional().trim().isLength({ min: 10, max: 5000 })
    .withMessage('Submission text must be between 10-5000 characters'),
  body('submission_links').optional().isArray()
    .withMessage('Submission links must be an array'),
  body('submission_links.*').optional().isURL()
    .withMessage('Each submission link must be a valid URL'),
  body('submission_files').optional().isArray()
    .withMessage('Submission files must be an array')
];

// Public routes (no auth required)
router.get('/', getAllAssignments);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getAssignmentById);

// Protected routes (auth required)
router.post('/:id/submit', authenticateToken, submissionValidation, submitAssignment);
router.get('/user/submissions', authenticateToken, getUserSubmissions);
router.get('/user/points', authenticateToken, getUserPoints);

module.exports = router;