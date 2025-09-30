const express = require('express');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { adminLogin, getAdminProfile, getAllPayments, updatePaymentStatus } = require('../controllers/adminController');

const router = express.Router();

// Admin routes
router.post('/login', adminLogin);
router.get('/profile', authenticateAdmin, getAdminProfile);
router.get('/payments', authenticateAdmin, getAllPayments);
router.put('/payments/:paymentId/status', authenticateAdmin, updatePaymentStatus);

module.exports = router;