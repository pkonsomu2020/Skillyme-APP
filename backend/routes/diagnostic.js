const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Diagnostic endpoint to check table structure
router.get('/check-payments-schema', async (req, res) => {
  try {
    console.log('Checking payments table schema...');
    
    // Get table structure
    const [columns] = await pool.execute('DESCRIBE payments');
    console.log('Payments table columns:', columns);
    
    // Try to get all data to see what's available
    const [rows] = await pool.execute('SELECT * FROM payments LIMIT 1');
    console.log('Sample payment data:', rows);
    
    res.json({
      success: true,
      columns: columns,
      sampleData: rows,
      message: 'Payments table schema retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking payments schema:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check payments table schema'
    });
  }
});

// Check if payments table exists
router.get('/check-payments-exists', async (req, res) => {
  try {
    console.log('Checking if payments table exists...');
    
    const [tables] = await pool.execute("SHOW TABLES LIKE 'payments'");
    console.log('Payments table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      const [columns] = await pool.execute('DESCRIBE payments');
      res.json({
        success: true,
        exists: true,
        columns: columns,
        message: 'Payments table exists'
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Payments table does not exist'
      });
    }
  } catch (error) {
    console.error('Error checking payments table:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check payments table'
    });
  }
});

module.exports = router;
