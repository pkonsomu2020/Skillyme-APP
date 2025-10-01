const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// MySQL Database setup endpoint
router.get('/setup-mysql-database', async (req, res) => {
  try {
    console.log('🚀 Setting up MySQL database tables...');
    
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        country VARCHAR(100),
        county VARCHAR(100),
        field_of_study VARCHAR(255),
        institution VARCHAR(255),
        level_of_study VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        recruiter VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        google_meet_link VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sessions table created');

    // Create payments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id INT NOT NULL,
        mpesa_code VARCHAR(50),
        full_mpesa_message TEXT,
        amount DECIMAL(10,2) NOT NULL,
        expected_amount DECIMAL(10,2) NOT NULL,
        actual_amount DECIMAL(10,2),
        amount_mismatch BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Payments table created');

    // Create admins table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created');

    // Create user_sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_session (user_id, session_id)
      )
    `);
    console.log('✅ User_sessions table created');

    // Create password_resets table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Password_resets table created');

    // Create secure_access table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS secure_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id INT NOT NULL,
        access_token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Secure_access table created');

    // Insert default admin user
    const hashedPassword = await bcrypt.hash('Skillyme@2025', 12);
    await pool.execute(
      'INSERT IGNORE INTO admins (username, password) VALUES (?, ?)',
      ['admin', hashedPassword]
    );
    console.log('✅ Default admin user created');

    // Insert sample session
    await pool.execute(`
      INSERT IGNORE INTO sessions (title, company, recruiter, date, time, price, description, google_meet_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Law Career Session',
      'Legal Professionals',
      'Legal Professionals',
      '2025-10-09',
      '14:00:00',
      200.00,
      'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.',
      'https://meet.google.com/nmh-nfxk-oao'
    ]);
    console.log('✅ Sample session created');

    res.json({
      success: true,
      message: 'MySQL database setup completed successfully!',
      tables: ['users', 'sessions', 'payments', 'admins', 'user_sessions', 'password_resets', 'secure_access'],
      admin: {
        username: 'admin',
        password: 'Skillyme@2025'
      }
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  }
});

// Test admin login endpoint
router.get('/test-admin-login', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', ['admin']);
    
    if (rows.length > 0) {
      res.json({
        success: true,
        message: 'Admin found',
        admin: {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Admin not found'
      });
    }
  } catch (error) {
    console.error('❌ Test admin login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Check secure_access table structure
router.get('/check-secure-access-table', async (req, res) => {
  try {
    const [rows] = await pool.execute('DESCRIBE secure_access');
    res.json({
      success: true,
      message: 'Secure access table structure',
      columns: rows
    });
  } catch (error) {
    console.error('❌ Check secure_access table failed:', error);
    res.status(500).json({
      success: false,
      message: 'Check secure_access table failed',
      error: error.message
    });
  }
});

module.exports = router;