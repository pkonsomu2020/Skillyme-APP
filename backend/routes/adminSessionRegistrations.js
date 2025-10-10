const express = require('express');
const { body, param } = require('express-validator');
const { cleanAuth } = require('../middleware/adminAuth');
const {
  getAllSessionRegistrations,
  getRegistrationById,
  getSessionRegistrations,
  updateRegistrationStatus,
  getRegistrationStats
} = require('../controllers/adminSessionRegistrationController');

const router = express.Router();

// Validation rules
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid registration ID is required')
];

const sessionIdValidation = [
  param('sessionId').isInt({ min: 1 }).withMessage('Valid session ID is required')
];

const statusValidation = [
  body('attendance_status').isIn(['registered', 'attended', 'absent']).withMessage('Invalid attendance status'),
  body('feedback').optional().isString().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters')
];

// Routes (all protected with clean admin authentication)
router.get('/', cleanAuth, getAllSessionRegistrations);
router.get('/stats', cleanAuth, getRegistrationStats);
router.get('/session/:sessionId', cleanAuth, sessionIdValidation, getSessionRegistrations);
router.get('/:id', cleanAuth, idValidation, getRegistrationById);
router.put('/:id/status', cleanAuth, idValidation, statusValidation, updateRegistrationStatus);

module.exports = router;