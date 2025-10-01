const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { generalLimiter, authLimiter, paymentLimiter, adminLimiter } = require('./middleware/rateLimiting');
const { securityHeaders, httpsRedirect, corsSecurity } = require('./middleware/securityHeaders');
const { csrfProtection, getCSRFToken, csrfErrorHandler } = require('./middleware/csrfProtection');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (required for Render)
app.set('trust proxy', 1);

// Security Middleware
app.use(httpsRedirect);
app.use(securityHeaders);
app.use(corsSecurity);

// CORS Configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:5173', // Main app (development)
    'http://localhost:8080', // Admin app (development)
    'http://localhost:8081', // Alternative admin port (development)
    'https://skillyme-app.vercel.app', // Production main app
    'https://skillyme-admin.vercel.app', // Production admin dashboard
    process.env.FRONTEND_URL, // Production frontend
    process.env.ADMIN_URL     // Production admin
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Rate Limiting
app.use(generalLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing for CSRF
app.use(cookieParser());

// CSRF Protection (exclude auth and payment endpoints)
app.use((req, res, next) => {
  // Skip CSRF for auth and payment endpoints
  if (
    (req.path === '/api/admin/login' && req.method === 'POST') ||
    (req.path === '/api/auth/register' && req.method === 'POST') ||
    (req.path === '/api/auth/login' && req.method === 'POST') ||
    (req.path === '/api/auth/forgot-password' && req.method === 'POST') ||
    (req.path === '/api/auth/reset-password' && req.method === 'POST') ||
    (req.path === '/api/payments/submit-mpesa' && req.method === 'POST') ||
    (req.path.startsWith('/api/admin/payments/') && req.path.endsWith('/status') && req.method === 'PUT')
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});
app.get('/api/csrf-token', getCSRFToken);

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/admin', adminLimiter, require('./routes/admin'));
app.use('/api/payments', paymentLimiter, require('./routes/payment'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/mysql-setup', require('./routes/mysql-setup'));
app.use('/api/diagnostic', require('./routes/diagnostic'));
app.use('/secure-access', require('./routes/secureAccess'));

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Skillyme API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CSRF Error handling
app.use(csrfErrorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Quick fix endpoint for secure_access table
app.get('/fix-secure-access', async (req, res) => {
  try {
    console.log('🔧 Quick fix of secure_access table...');
    
    await pool.execute('DROP TABLE IF EXISTS secure_access');
    console.log('✅ Dropped table');
    
    await pool.execute(`
      CREATE TABLE secure_access (
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
    console.log('✅ Created new table');
    
    res.json({ success: true, message: 'Secure access table fixed' });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check secure_access table structure
app.get('/check-secure-access', async (req, res) => {
  try {
    const [rows] = await pool.execute('DESCRIBE secure_access');
    res.json({
      success: true,
      message: 'Secure access table structure',
      columns: rows.map(r => ({ Field: r.Field, Type: r.Type }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test secure access creation
app.get('/test-secure-access', async (req, res) => {
  try {
    const SecureAccess = require('./models/SecureAccess');
    
    // Test creating secure access
    const token = await SecureAccess.createSecureAccess(1, 1);
    
    res.json({
      success: true,
      message: 'Secure access test successful',
      token: token
    });
  } catch (error) {
    console.error('❌ Secure access test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test email sending
app.get('/test-email', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    
    // Test sending email
    const result = await emailService.sendPaymentStatusUpdate(
      'test@example.com',
      'Test User',
      'Test Session',
      'paid',
      'https://meet.google.com/test'
    );
    
    res.json({
      success: true,
      message: 'Email test completed',
      result: result
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check environment variables
app.get('/check-env', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Environment variables check',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comprehensive email diagnostic
app.get('/diagnostic-email', async (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET'
      },
      database: {},
      secureAccess: {},
      emailService: {}
    };
    
    // Test database connection
    try {
      await pool.execute('SELECT 1 as test');
      diagnostic.database.connection = 'SUCCESS';
    } catch (error) {
      diagnostic.database.connection = 'FAILED';
      diagnostic.database.error = error.message;
    }
    
    // Check secure_access table
    try {
      const [rows] = await pool.execute('DESCRIBE secure_access');
      diagnostic.secureAccess.exists = true;
      diagnostic.secureAccess.columns = rows.map(r => ({ Field: r.Field, Type: r.Type }));
    } catch (error) {
      diagnostic.secureAccess.exists = false;
      diagnostic.secureAccess.error = error.message;
    }
    
    // Test email service
    try {
      const emailService = require('./services/emailService');
      // Test if email service is properly configured
      if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) {
        diagnostic.emailService.connection = 'SUCCESS';
        diagnostic.emailService.provider = process.env.RESEND_API_KEY ? 'Resend' : 'SendGrid';
      } else {
        diagnostic.emailService.connection = 'FAILED';
        diagnostic.emailService.error = 'No email service API keys configured';
      }
    } catch (error) {
      diagnostic.emailService.connection = 'FAILED';
      diagnostic.emailService.error = error.message;
    }
    
    res.json({
      success: true,
      message: 'Email diagnostic completed',
      diagnostic: diagnostic
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Skillyme API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8081'}`);
  console.log(`🔧 Admin URL: ${process.env.ADMIN_URL || 'http://localhost:8080'}`);
});