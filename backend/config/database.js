const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillyme_db',
  port: process.env.DB_PORT || 3306,
  ssl: false, // Disable SSL for Fly.io MySQL
  waitForConnections: true,
  connectionLimit: 20, // Increased for better performance
  queueLimit: 0,
  acquireTimeout: 10000, // Reduced from 60s to 10s
  timeout: 10000, // Reduced from 60s to 10s
  reconnect: true,
  // Performance optimizations
  multipleStatements: false,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true
};

const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

module.exports = pool;