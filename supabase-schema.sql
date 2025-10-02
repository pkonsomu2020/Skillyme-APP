-- Supabase Schema for Skillyme Platform
-- This file contains the complete database schema for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (will be extended by Supabase Auth)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  county VARCHAR(100),
  field_of_study VARCHAR(100) NOT NULL,
  institution VARCHAR(255),
  level_of_study VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(100) NOT NULL,
  recruiter VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price DECIMAL(10,2) DEFAULT 200.00,
  description TEXT,
  google_meet_link VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paybill_number VARCHAR(20),
  business_number VARCHAR(20)
);

-- Payments table
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  mpesa_code VARCHAR(50) NOT NULL,
  full_mpesa_message TEXT,
  amount DECIMAL(10,2) NOT NULL,
  expected_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  amount_mismatch BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions (attendance tracking)
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Admins table
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password resets table
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure access table
CREATE TABLE secure_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  access_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_active ON sessions(is_active);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_amount_mismatch ON payments(amount_mismatch);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_attendance_status ON user_sessions(attendance_status);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

CREATE INDEX idx_secure_access_token ON secure_access(access_token);
CREATE INDEX idx_secure_access_user_id ON secure_access(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view and update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Sessions are viewable by everyone (public)
CREATE POLICY "Sessions are viewable by everyone" ON sessions
  FOR SELECT USING (is_active = true);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can view their own session registrations
CREATE POLICY "Users can view own session registrations" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own session registrations" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admins can access admin data (requires custom role check)
CREATE POLICY "Admins can access admin data" ON admins
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Password resets are accessible by the user
CREATE POLICY "Users can access own password resets" ON password_resets
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Secure access tokens are accessible by the user
CREATE POLICY "Users can access own secure access" ON secure_access
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Insert sample data
INSERT INTO sessions (title, description, recruiter_name, company, session_date, session_time, duration, max_participants, price, paybill_number, business_number) VALUES 
('Are you curious about building a career in law? 🎓⚖️', 'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.', 'Legal Professionals', 'Law Career Session', '2025-10-09', '14:00:00', 90, 50, 200.00, '714888', '272177');

-- Insert default admin
INSERT INTO admins (username, email, role) VALUES 
('admin', 'admin@skillyme.com', 'super_admin');

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
