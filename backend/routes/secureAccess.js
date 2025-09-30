const express = require('express');
const { verifySecureAccess, getSecureAccessPage } = require('../controllers/secureAccessController');

const router = express.Router();

// Get secure access page (HTML)
router.get('/:token', getSecureAccessPage);

// Verify secure access token (API)
router.get('/api/secure-access/:token', verifySecureAccess);

module.exports = router;
