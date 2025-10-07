const express = require('express');
const { body, param } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionAttendees
} = require('../controllers/adminSessionController');

const router = express.Router();

// Validation rules
const sessionValidation = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('google_meet_link').optional().isURL().withMessage('Valid Google Meet URL is required'),
  body('recruiter').notEmpty().trim().isLength({ min: 2, max: 255 }).withMessage('Recruiter name must be 2-255 characters'),
  body('company').optional().trim().isLength({ max: 255 }).withMessage('Company name must be less than 255 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive integer'),
  body('poster_url').optional().isURL().withMessage('Valid poster URL is required'),
  body('thumbnail_url').optional().isURL().withMessage('Valid thumbnail URL is required')
];

const updateSessionValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('google_meet_link').optional().isURL().withMessage('Valid Google Meet URL is required'),
  body('recruiter').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Recruiter name must be 2-255 characters'),
  body('company').optional().trim().isLength({ max: 255 }).withMessage('Company name must be less than 255 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive integer'),
  body('poster_url').optional().isURL().withMessage('Valid poster URL is required'),
  body('thumbnail_url').optional().isURL().withMessage('Valid thumbnail URL is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('is_completed').optional().isBoolean().withMessage('is_completed must be a boolean')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid session ID is required')
];

// Routes
router.get('/', getAllSessions);
router.get('/:id', idValidation, getSessionById);
router.post('/', sessionValidation, createSession);
router.put('/:id', idValidation, updateSessionValidation, updateSession);
router.delete('/:id', idValidation, deleteSession);
router.get('/:id/attendees', idValidation, getSessionAttendees);

module.exports = router;
