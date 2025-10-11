const express = require('express');
const { body, query } = require('express-validator');
const { authenticateAdmin, cleanAuth } = require('../middleware/adminAuth');
const {
  sendNotification,
  getNotificationHistory,
  sendSessionReminder,
  getRecipientOptions
} = require('../controllers/adminNotificationController');

const router = express.Router();

// Validation rules
const notificationValidation = [
  body('type').isIn(['session_reminder', 'new_session', 'broadcast']).withMessage('Valid notification type is required'),
  body('subject').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Subject must be 3-255 characters'),
  body('message').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  body('recipients').isIn(['all', 'session', 'field', 'institution']).withMessage('Valid recipient type is required'),
  body('session_id').optional().isInt({ min: 1 }).withMessage('Valid session ID is required'),
  body('field_of_study').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Field of study must be 2-255 characters'),
  body('institution').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Institution must be 2-255 characters')
];

const sessionReminderValidation = [
  body('session_id').isInt({ min: 1 }).withMessage('Valid session ID is required'),
  body('reminder_type').optional().isIn(['24h', '1h']).withMessage('Valid reminder type is required')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Routes (protected with clean authentication)
router.post('/send', cleanAuth, notificationValidation, sendNotification);
router.get('/history', cleanAuth, paginationValidation, getNotificationHistory);
router.post('/session-reminder', cleanAuth, sessionReminderValidation, sendSessionReminder);
router.get('/recipient-options', cleanAuth, getRecipientOptions);

module.exports = router;
