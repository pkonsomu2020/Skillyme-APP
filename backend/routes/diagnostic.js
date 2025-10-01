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

// Get all tables and their schemas
router.get('/all-tables-schema', async (req, res) => {
  try {
    console.log('Getting all tables and their schemas...');
    
    // Get all tables
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('All tables:', tables);
    
    const tableSchemas = {};
    
    // Get schema for each table
    for (const table of tables) {
      const tableName = Object.values(table)[0]; // Get the table name from the result
      console.log(`Getting schema for table: ${tableName}`);
      
      try {
        const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
        tableSchemas[tableName] = columns;
        console.log(`${tableName} columns:`, columns);
      } catch (error) {
        console.error(`Error getting schema for ${tableName}:`, error);
        tableSchemas[tableName] = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      tables: tables,
      schemas: tableSchemas,
      message: 'All table schemas retrieved successfully'
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
    
    const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
    console.log(`${tableName} columns:`, columns);
    
    // Also get sample data
    const [sampleData] = await pool.execute(`SELECT * FROM ${tableName} LIMIT 3`);
    console.log(`${tableName} sample data:`, sampleData);
    
    res.json({
      success: true,
      tableName: tableName,
      columns: columns,
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
