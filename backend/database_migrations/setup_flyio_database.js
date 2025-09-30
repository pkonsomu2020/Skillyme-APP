/**
 * Database Setup Script for Fly.io MySQL
 * This script sets up all tables and initial data for the Skillyme production database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: false // Fly.io handles SSL internally
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Setting up Skillyme Production Database on Fly.io...');
    console.log(`📊 Connecting to: ${dbConfig.host}:${dbConfig.port}`);
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Fly.io database successfully');

    // Create users table
    console.log('👥 Creating users table...');
    await connection.execute(`
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
    console.log('📅 Creating sessions table...');
    await connection.execute(`
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
    console.log('💳 Creating payments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id INT NOT NULL,
        mpesa_code VARCHAR(50),
        full_mpesa_message TEXT,
        amount DECIMAL(10,2) NOT NULL,
        expected_amount DECIMAL(10,2) NOT NULL,
        actual_amount DECIMAL(10,2),
        amount_mismatch BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'paid', 'rejected') DEFAULT 'pending',
        admin_notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Payments table created');

    // Create admins table
    console.log('👨‍💼 Creating admins table...');
    await connection.execute(`
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
    console.log('🔗 Creating user_sessions table...');
    await connection.execute(`
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
    console.log('🔐 Creating password_resets table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Password_resets table created');

    // Create secure_access table
    console.log('🛡️ Creating secure_access table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS secure_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        admin_id INT,
        access_type ENUM('user', 'admin') NOT NULL,
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
    console.log('👨‍💼 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Skillyme@2025', 12);
    
    await connection.execute(`
      INSERT IGNORE INTO admins (username, password) 
      VALUES (?, ?)
    `, ['admin', hashedPassword]);
    console.log('✅ Admin user created (username: admin, password: Skillyme@2025)');

    // Insert sample session
    console.log('📅 Creating sample session...');
    await connection.execute(`
      INSERT IGNORE INTO sessions (title, company, recruiter, date, time, price, description, google_meet_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Database is ready for production use');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Fly.io database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
