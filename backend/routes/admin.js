const express = require('express');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { 
  adminLogin, getAdminProfile, getAllPayments, updatePaymentStatus,
  getAllSessions, createSession, updateSession 
} = require('../controllers/adminController');

const router = express.Router();

// Admin routes
router.post('/login', adminLogin);
router.get('/profile', authenticateAdmin, getAdminProfile);

// Payment management
router.get('/payments', authenticateAdmin, getAllPayments);
router.put('/payments/:paymentId/status', authenticateAdmin, updatePaymentStatus);

// Session management
router.get('/sessions', authenticateAdmin, getAllSessions);
router.post('/sessions', authenticateAdmin, createSession);
router.put('/sessions/:sessionId', authenticateAdmin, updateSession);

module.exports = router;