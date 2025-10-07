const express = require('express');
const { body, param } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserStats,
  getFilterOptions
} = require('../controllers/adminUserController');

const router = express.Router();

// Validation rules
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
];

const statusValidation = [
  body('is_active').isBoolean().withMessage('is_active must be a boolean value')
];

// Routes
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.get('/filter-options', getFilterOptions);
router.get('/:id', idValidation, getUserById);
router.put('/:id/status', idValidation, statusValidation, updateUserStatus);

module.exports = router;
