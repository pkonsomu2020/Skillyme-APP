const express = require('express');
const { param } = require('express-validator');
const { cleanAuth } = require('../middleware/adminAuth');
const {
  getAllCompanies,
  getCompanyByName,
  getCompanyStats
} = require('../controllers/adminCompanyController');

const router = express.Router();

// Validation rules
const nameValidation = [
  param('name').notEmpty().trim().withMessage('Company name is required')
];

// Routes (all protected with clean admin authentication)
router.get('/', cleanAuth, getAllCompanies);
router.get('/stats', cleanAuth, getCompanyStats);
router.get('/:name', cleanAuth, nameValidation, getCompanyByName);

module.exports = router;