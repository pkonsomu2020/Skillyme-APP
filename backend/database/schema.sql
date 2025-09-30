-- Skillyme Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS skillyme_db;
USE skillyme_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    county VARCHAR(100) NULL,
    field_of_study VARCHAR(100) NOT NULL,
    institution VARCHAR(255) NULL,
    level_of_study ENUM('High School', 'Undergraduate', 'Graduate', 'Postgraduate') NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_country (country),
    INDEX idx_created_at (created_at)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recruiter_name VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INT NOT NULL DEFAULT 90,
    google_meet_link VARCHAR(500) NULL,
    max_participants INT DEFAULT 50,
    price DECIMAL(10,2) DEFAULT 200.00,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    mpesa_code VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT 'Expected amount (session price)',
    actual_amount DECIMAL(10,2) NULL COMMENT 'Actual amount paid via M-Pesa',
    amount_mismatch BOOLEAN DEFAULT FALSE COMMENT 'True if actual amount differs from expected',
    status ENUM('pending', 'paid', 'failed', 'amount_mismatch') DEFAULT 'pending',
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_amount_mismatch (amount_mismatch),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- User sessions (attendance tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    payment_id INT NOT NULL,
    attendance_status ENUM('registered', 'attended', 'absent') DEFAULT 'registered',
    feedback TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_session (user_id, session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_attendance_status (attendance_status)
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin (password: admin123)
INSERT INTO admins (username, email, password, role) VALUES 
('admin', 'admin@skillyme.com', '$2a$12$z1phhDmYUJGYV/scDN4ew.z7gUG/TBzapwa2KwwT7/dpzF13UpqZu', 'super_admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample session
INSERT INTO sessions (title, description, recruiter_name, company, session_date, session_time, duration, max_participants, price) VALUES 
('Are you curious about building a career in law? 🎓⚖️', 'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.', 'Legal Professionals', 'Law Career Session', '2025-10-09', '14:00:00', 90, 50, 200.00)
ON DUPLICATE KEY UPDATE title = title;
