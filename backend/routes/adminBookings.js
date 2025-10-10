const express = require('express');
const { body, param } = require('express-validator');
const { cleanAuth } = require('../middleware/adminAuth');
const {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats
} = require('../controllers/adminBookingController');

const router = express.Router();

// Validation rules
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid booking ID is required')
];

const statusValidation = [
  body('attendance_status').isIn(['registered', 'attended', 'absent']).withMessage('Invalid attendance status'),
  body('feedback').optional().isString().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters')
];

// Routes (all protected with clean admin authentication)
router.get('/', cleanAuth, getAllBookings);
router.get('/stats', cleanAuth, getBookingStats);
router.get('/:id', cleanAuth, idValidation, getBookingById);
router.put('/:id/status', cleanAuth, idValidation, statusValidation, updateBookingStatus);

module.exports = router;