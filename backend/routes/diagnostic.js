const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Diagnostic endpoint to check table structure
router.get('/check-payments-schema', async (req, res) => {
  try {
    console.log('Checking payments table schema...');
    
    // Get sample data from payments table
    const { data: sampleData, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('Sample payment data:', sampleData);
    
    res.json({
      success: true,
      sampleData: sampleData,
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
    
    const { data, error } = await supabase
      .from('payments')
      .select('payment_id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        res.json({
          success: true,
          exists: false,
          message: 'Payments table does not exist'
        });
      } else {
        throw error;
      }
    } else {
      res.json({
        success: true,
        exists: true,
        message: 'Payments table exists'
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

// Get all tables and their schemas
router.get('/all-tables-schema', async (req, res) => {
  try {
    console.log('Getting all tables and their schemas...');
    
    // Test connection to main tables
    const tables = ['users', 'sessions', 'payments', 'admins', 'user_sessions', 'password_resets', 'secure_access'];
    const tableStatus = {};
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          tableStatus[tableName] = { exists: false, error: error.message };
        } else {
          tableStatus[tableName] = { exists: true, sampleData: data };
        }
      } catch (error) {
        tableStatus[tableName] = { exists: false, error: error.message };
      }
    }
    
    res.json({
      success: true,
      tables: tables,
      status: tableStatus,
      message: 'All table status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting all table schemas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get all table schemas'
    });
  }
});

// Get specific table schema
router.get('/table-schema/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`Getting schema for table: ${tableName}`);
    
    // Get sample data from the table
    const { data: sampleData, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (error) {
      throw error;
    }
    
    console.log(`${tableName} sample data:`, sampleData);
    
    res.json({
      success: true,
      tableName: tableName,
      sampleData: sampleData,
      message: `Schema for ${tableName} retrieved successfully`
    });
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to get schema for ${tableName}`
    });
  }
});

module.exports = router;
