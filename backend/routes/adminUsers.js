const express = require('express');
const { body, param } = require('express-validator');
const { authenticateAdmin, cleanAuth } = require('../middleware/adminAuth');
const {
  getAllUsers,
  getAllUsersDebug,
  getUserById,
  updateUserStatus,
  getUserStats,
  getFilterOptions,
  deleteUser,
  cleanupTestUsers
} = require('../controllers/adminUserController');

const router = express.Router();

// Validation rules
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
];

const statusValidation = [
  body('is_active').isBoolean().withMessage('is_active must be a boolean value')
];

// Routes (all protected with clean admin authentication)
router.get('/', cleanAuth, getAllUsers);
router.get('/debug/all', cleanAuth, getAllUsersDebug);
router.get('/stats', cleanAuth, getUserStats);
router.get('/filter-options', cleanAuth, getFilterOptions);
router.post('/cleanup', cleanAuth, cleanupTestUsers);
router.get('/:id', cleanAuth, idValidation, getUserById);
router.put('/:id/status', cleanAuth, idValidation, statusValidation, updateUserStatus);
router.delete('/:id', cleanAuth, idValidation, deleteUser);

module.exports = router;
