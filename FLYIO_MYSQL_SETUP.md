# Fly.io MySQL + Render Backend Setup Guide

## 🚀 Complete Setup: Fly.io MySQL Database + Render Backend

This guide will help you deploy a MySQL database on Fly.io and connect it to your backend on Render.

## Prerequisites
- GitHub repository with your code
- Fly.io account (free tier available)
- Render account (free tier available)
- Terminal/Command line access

## Step 1: Setup MySQL Database on Fly.io

### 1.1 Install Fly.io CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS
curl -L https://fly.io/install.sh | sh

# Linux
curl -L https://fly.io/install.sh | sh
```

### 1.2 Login to Fly.io
```bash
fly auth login
```

### 1.3 Create MySQL Database
```bash
# Create a new MySQL app
fly apps create skillyme-mysql

# Create the database configuration
fly secrets set MYSQL_ROOT_PASSWORD=your-super-secure-root-password
fly secrets set MYSQL_DATABASE=skillyme_production
fly secrets set MYSQL_USER=skillyme_user
fly secrets set MYSQL_PASSWORD=your-super-secure-user-password
```

### 1.4 Create Fly.io Configuration
Create `fly.toml` in your project root:

```toml
# fly.toml
app = "skillyme-mysql"
primary_region = "iad"

[build]

[env]
  MYSQL_ROOT_PASSWORD = "your-super-secure-root-password"
  MYSQL_DATABASE = "skillyme_production"
  MYSQL_USER = "skillyme_user"
  MYSQL_PASSWORD = "your-super-secure-user-password"

[[services]]
  protocol = "tcp"
  internal_port = 3306

  [[services.ports]]
    port = 3306
    handlers = ["tcp"]
    force_https = false

  [[services.tcp_checks]]
    interval = "10s"
    timeout = "5s"
    grace_period = "5s"
```

### 1.5 Deploy MySQL to Fly.io
```bash
# Deploy the MySQL database
fly deploy

# Get the database connection details
fly info
```

### 1.6 Get Database Connection Details
After deployment, you'll get:
- **Host**: `skillyme-mysql.fly.dev`
- **Port**: `3306`
- **Database**: `skillyme_production`
- **User**: `skillyme_user`
- **Password**: `your-super-secure-user-password`

## Step 2: Setup Database Tables

### 2.1 Create Database Setup Script for Fly.io
Create `backend/database_migrations/setup_flyio_database.js`:

```javascript
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
```

## Step 3: Deploy Backend to Render

### 3.1 Create Web Service on Render
1. **Login to [render.com](https://render.com)**
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - **Name**: `skillyme-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18.x or 20.x

### 3.2 Environment Variables for Render
Set these in your Render web service dashboard:

```bash
# Database Configuration (Fly.io MySQL)
DB_HOST=skillyme-mysql.fly.dev
DB_USER=skillyme_user
DB_PASSWORD=your-super-secure-user-password
DB_NAME=skillyme_production
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com

# Application URLs (Update after frontend deployment)
FRONTEND_URL=https://your-frontend-domain.vercel.app
ADMIN_URL=https://your-admin-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-admin-domain.vercel.app

# Server Configuration
PORT=10000
NODE_ENV=production

# Security
BCRYPT_ROUNDS=12
```

### 3.3 Deploy Backend
1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
3. **Note the service URL** (e.g., `https://skillyme-backend.onrender.com`)

## Step 4: Setup Database Tables

### 4.1 Run Database Setup Script
After your backend is deployed, you need to set up the database tables:

**Option A: Using Render Shell (Recommended)**
1. Go to your web service dashboard
2. Click on "Shell" tab
3. Run: `node database_migrations/setup_flyio_database.js`

**Option B: Using Local Connection**
1. Set up environment variables locally
2. Run the setup script from your local machine

### 4.2 Verify Database Setup
After running the setup script, verify:
- [ ] All tables created successfully
- [ ] Admin user created (username: `admin`, password: `Skillyme@2025`)
- [ ] Sample session created
- [ ] Database is ready for use

## Step 5: Test Connection

### 5.1 Health Check
Visit: `https://your-backend-url.onrender.com/api/test`

Expected response:
```json
{
  "message": "Skillyme API is running!",
  "timestamp": "2024-12-19T...",
  "environment": "production"
}
```

### 5.2 Test Database Connection
Visit: `https://your-backend-url.onrender.com/api/admin/login`

Try logging in with:
- **Username**: `admin`
- **Password**: `Skillyme@2025`

## Step 6: Deploy Frontend to Vercel

### 6.1 Main App
1. **Connect to Vercel**
2. **Set Environment Variable**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
3. **Deploy**

### 6.2 Admin Dashboard
1. **Create separate Vercel project**
2. **Root directory**: `Skillyme_Admin`
3. **Set Environment Variable**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
4. **Deploy**

## 🎯 Benefits of This Setup

### ✅ **Fly.io MySQL Advantages:**
- **Global Edge**: Database close to users worldwide
- **Automatic Scaling**: Scales with your app
- **High Performance**: Optimized for speed
- **Cost Effective**: Free tier available
- **Easy Management**: Simple CLI and dashboard

### ✅ **Render Backend Advantages:**
- **Easy Deployment**: GitHub integration
- **Automatic SSL**: HTTPS out of the box
- **Health Monitoring**: Built-in health checks
- **Easy Scaling**: Scale up as needed
- **Cost Effective**: Free tier available

## 🔧 Troubleshooting

### Common Issues:
1. **Database Connection Failed**: Check Fly.io database status
2. **CORS Errors**: Verify ALLOWED_ORIGINS in Render
3. **Email Not Sending**: Check Gmail app password
4. **Service Not Starting**: Check logs in Render dashboard

### Debug Steps:
1. **Check Fly.io Status**: `fly status`
2. **Check Render Logs**: Go to your service dashboard → Logs
3. **Test Database**: Use Fly.io CLI to test DB connection
4. **Verify Environment Variables**: Check all variables are set

## 📊 Monitoring

### Fly.io Monitoring:
- **Database Performance**: CPU, memory, connections
- **Global Latency**: Response times worldwide
- **Health Checks**: Automatic monitoring

### Render Monitoring:
- **Service Health**: Automatic health checks
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, request metrics

## 🚀 Production Checklist

- [ ] Fly.io MySQL database created and running
- [ ] Database tables created and populated
- [ ] Render backend deployed and running
- [ ] Database connection working
- [ ] Health check passing
- [ ] CORS configured
- [ ] Email service working
- [ ] Frontend deployed to Vercel
- [ ] All URLs updated
- [ ] Complete flow tested
- [ ] SSL certificates active
- [ ] Monitoring configured

## 🎉 Success!

Your Skillyme application is now fully deployed with:
- ✅ **MySQL Database**: Running on Fly.io
- ✅ **Backend API**: Running on Render
- ✅ **Frontend**: Deployed on Vercel
- ✅ **Admin Dashboard**: Deployed on Vercel
- ✅ **Email Service**: Configured and working
- ✅ **Security**: All security features active

Your application is now ready for production use! 🚀
