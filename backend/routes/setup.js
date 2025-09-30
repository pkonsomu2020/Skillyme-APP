const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Database setup endpoint (for initial setup only)
router.get('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Setting up database tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sessions table created');

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id INTEGER NOT NULL,
        mpesa_code VARCHAR(50),
        full_mpesa_message TEXT,
        amount DECIMAL(10,2) NOT NULL,
        expected_amount DECIMAL(10,2) NOT NULL,
        actual_amount DECIMAL(10,2),
        amount_mismatch BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
        admin_notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Payments table created');

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created');

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        UNIQUE (user_id, session_id)
      )
    `);
    console.log('✅ User_sessions table created');

    // Create password_resets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Password_resets table created');

    // Create secure_access table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secure_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        admin_id INTEGER,
        access_type VARCHAR(10) NOT NULL CHECK (access_type IN ('user', 'admin')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_success BOOLEAN DEFAULT FALSE,
        failure_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Secure_access table created');

    // Insert admin user
    const hashedPassword = await bcrypt.hash('Skillyme@2025', 12);
    await pool.query(`
      INSERT INTO admins (username, password) 
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword]);
    console.log('✅ Admin user created (username: admin, password: Skillyme@2025)');

    // Insert sample session
    await pool.query(`
      INSERT INTO sessions (title, company, recruiter, date, time, price, description, google_meet_link) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `, [
      'Law Career Session',
      'Kenya Law Society',
      'John Mwangi',
      '2024-12-20',
      '14:00:00',
      200.00,
      'Join us for an interactive session about careers in law. Learn about different legal specializations, career paths, and opportunities in Kenya.',
      'https://meet.google.com/nmh-nfxk-oao'
    ]);
    console.log('✅ Sample session created');

    res.json({
      success: true,
      message: 'Database setup completed successfully!',
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

// Also support POST method for flexibility
router.post('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Setting up database tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sessions table created');

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id INTEGER NOT NULL,
        mpesa_code VARCHAR(50),
        full_mpesa_message TEXT,
        amount DECIMAL(10,2) NOT NULL,
        expected_amount DECIMAL(10,2) NOT NULL,
        actual_amount DECIMAL(10,2),
        amount_mismatch BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
        admin_notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Payments table created');

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created');

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        UNIQUE (user_id, session_id)
      )
    `);
    console.log('✅ User_sessions table created');

    // Create password_resets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Password_resets table created');

    // Create secure_access table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secure_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        admin_id INTEGER,
        access_type VARCHAR(10) NOT NULL CHECK (access_type IN ('user', 'admin')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_success BOOLEAN DEFAULT FALSE,
        failure_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Secure_access table created');

    // Insert admin user
    const hashedPassword = await bcrypt.hash('Skillyme@2025', 12);
    await pool.query(`
      INSERT INTO admins (username, password) 
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword]);
    console.log('✅ Admin user created (username: admin, password: Skillyme@2025)');

    // Insert sample session
    await pool.query(`
      INSERT INTO sessions (title, company, recruiter, date, time, price, description, google_meet_link) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `, [
      'Law Career Session',
      'Kenya Law Society',
      'John Mwangi',
      '2024-12-20',
      '14:00:00',
      200.00,
      'Join us for an interactive session about careers in law. Learn about different legal specializations, career paths, and opportunities in Kenya.',
      'https://meet.google.com/nmh-nfxk-oao'
    ]);
    console.log('✅ Sample session created');

    res.json({
      success: true,
      message: 'Database setup completed successfully!',
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
    // Find admin
    const query = 'SELECT * FROM admins WHERE username = $1';
    const result = await pool.query(query, ['admin']);
    
    if (!result.rows || result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Admin not found'
      });
    }

    const admin = result.rows[0];
    
    res.json({
      success: true,
      message: 'Admin found',
      admin: {
        id: admin.id,
        username: admin.username,
        created_at: admin.created_at
      }
    });

  } catch (error) {
    console.error('❌ Test admin login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test admin login failed',
      error: error.message
    });
  }
});

module.exports = router;
