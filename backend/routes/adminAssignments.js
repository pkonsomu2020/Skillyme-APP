const express = require('express');
const { body, param } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAllSubmissions,
  reviewSubmission,
  getAssignmentStats,
  getPlatformStats
} = require('../controllers/adminAssignmentController');

const router = express.Router();

// Validation rules
const assignmentValidation = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 characters'),
  body('description').notEmpty().trim().isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters'),
  body('instructions').optional().trim().isLength({ max: 3000 })
    .withMessage('Instructions must be less than 3000 characters'),
  body('session_id').optional().isInt({ min: 1 })
    .withMessage('Session ID must be a positive integer'),
  body('difficulty_level').optional().isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty level must be easy, medium, or hard'),
  body('points_reward').optional().isInt({ min: 1, max: 1000 })
    .withMessage('Points reward must be between 1-1000'),
  body('submission_type').optional().isIn(['text', 'link', 'file', 'mixed'])
    .withMessage('Submission type must be text, link, file, or mixed'),
  body('due_date').optional().isISO8601()
    .withMessage('Due date must be a valid date')
];

const updateAssignmentValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters'),
  body('instructions').optional().trim().isLength({ max: 3000 })
    .withMessage('Instructions must be less than 3000 characters'),
  body('difficulty_level').optional().isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty level must be easy, medium, or hard'),
  body('points_reward').optional().isInt({ min: 1, max: 1000 })
    .withMessage('Points reward must be between 1-1000'),
  body('submission_type').optional().isIn(['text', 'link', 'file', 'mixed'])
    .withMessage('Submission type must be text, link, file, or mixed'),
  body('due_date').optional().isISO8601()
    .withMessage('Due date must be a valid date'),
  body('is_active').optional().isBoolean()
    .withMessage('is_active must be a boolean')
];

const reviewValidation = [
  body('status').isIn(['approved', 'rejected', 'needs_revision'])
    .withMessage('Status must be approved, rejected, or needs_revision'),
  body('admin_feedback').optional().trim().isLength({ max: 1000 })
    .withMessage('Admin feedback must be less than 1000 characters'),
  body('points_earned').optional().isInt({ min: 0, max: 1000 })
    .withMessage('Points earned must be between 0-1000')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid assignment ID is required')
];

// All routes require admin authentication
router.use(authenticateAdmin);

// Assignment management routes
router.get('/', getAllAssignments);
router.post('/', assignmentValidation, createAssignment);
router.put('/:id', idValidation, updateAssignmentValidation, updateAssignment);
router.delete('/:id', idValidation, deleteAssignment);
router.get('/:id/stats', idValidation, getAssignmentStats);

// Submission review routes
router.get('/submissions', getAllSubmissions);
router.put('/submissions/:id/review', idValidation, reviewValidation, reviewSubmission);

// Platform statistics
router.get('/platform/stats', getPlatformStats);

module.exports = router;