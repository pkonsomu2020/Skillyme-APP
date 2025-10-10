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

// Routes (all protected with admin authentication)
router.get('/', authenticateAdmin, getAllUsers);
router.get('/stats', authenticateAdmin, getUserStats);
router.get('/filter-options', authenticateAdmin, getFilterOptions);
router.get('/:id', authenticateAdmin, idValidation, getUserById);
router.put('/:id/status', authenticateAdmin, idValidation, statusValidation, updateUserStatus);

module.exports = router;
