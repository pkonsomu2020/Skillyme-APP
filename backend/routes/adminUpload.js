const express = require('express');
const { body } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  upload,
  uploadSessionPoster,
  uploadSessionThumbnail,
  deleteSessionPoster,
  getUploadStats
} = require('../controllers/adminUploadController');

const router = express.Router();

// Validation rules
const sessionIdValidation = [
  body('session_id').isInt({ min: 1 }).withMessage('Valid session ID is required')
];

// Routes
router.post('/session-poster', sessionIdValidation, upload.single('poster'), uploadSessionPoster);
router.post('/session-thumbnail', sessionIdValidation, upload.single('thumbnail'), uploadSessionThumbnail);
router.delete('/session-poster', sessionIdValidation, deleteSessionPoster);
router.get('/stats', getUploadStats);

module.exports = router;
