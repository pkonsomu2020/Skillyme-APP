const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { generalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiting');
const { securityHeaders, httpsRedirect, corsSecurity } = require('./middleware/securityHeaders');
const { csrfProtection, getCSRFToken, csrfErrorHandler } = require('./middleware/csrfProtection');
// Database connection is now handled by individual models using Supabase
// const pool = require('./config/database'); // DEPRECATED: Now using Supabase
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
    'https://skillyme-app.vercel.app', // Production main app
    process.env.FRONTEND_URL // Production frontend
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
    (req.path === '/api/auth/register' && req.method === 'POST') ||
    (req.path === '/api/auth/login' && req.method === 'POST') ||
    (req.path === '/api/auth/forgot-password' && req.method === 'POST') ||
    (req.path === '/api/auth/reset-password' && req.method === 'POST') ||
    (req.path === '/api/payments/submit-mpesa' && req.method === 'POST')
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});
app.get('/api/csrf-token', getCSRFToken);

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/payments', paymentLimiter, require('./routes/payment'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sessions', require('./routes/sessions'));
// MySQL setup route removed - now using Supabase
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

// DEPRECATED: MySQL-specific endpoint removed
// Secure access table is now managed through Supabase

// DEPRECATED: MySQL-specific endpoint removed
// Use Supabase dashboard to check table structure

// SECURITY RISK: Test endpoints should be removed in production
// Test secure access creation (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === 'development') {
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
}

// SECURITY RISK: Test endpoints should be removed in production
// Test email sending (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === 'development') {
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
        result: result,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
          SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
          GMAIL_USER: process.env.GMAIL_USER ? 'SET' : 'NOT SET',
          GMAIL_PASS: process.env.GMAIL_PASS ? 'SET' : 'NOT SET'
        }
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
}

// SECURITY RISK: Environment variables exposure
// Check environment variables (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === 'development') {
  app.get('/check-env', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Environment variables check',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
          SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
          GMAIL_USER: process.env.GMAIL_USER ? 'SET' : 'NOT SET',
          GMAIL_PASS: process.env.GMAIL_PASS ? 'SET' : 'NOT SET'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// SECURITY RISK: Diagnostic endpoints expose sensitive information
// Comprehensive email diagnostic (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === 'development') {
  app.get('/diagnostic-email', async (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
        GMAIL_USER: process.env.GMAIL_USER ? 'SET' : 'NOT SET',
        GMAIL_PASS: process.env.GMAIL_PASS ? 'SET' : 'NOT SET'
      },
      database: {},
      secureAccess: {},
      emailService: {}
    };
    
    // Test Supabase connection
    try {
      const supabase = require('./config/supabase');
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        throw error;
      }
      diagnostic.database.connection = 'SUCCESS';
      diagnostic.database.provider = 'Supabase';
    } catch (error) {
      diagnostic.database.connection = 'FAILED';
      diagnostic.database.error = error.message;
    }
    
    // Check secure_access table
    try {
      const supabase = require('./config/supabase');
      const { data, error } = await supabase.from('secure_access').select('*').limit(1);
      if (error) {
        throw error;
      }
      diagnostic.secureAccess.exists = true;
      diagnostic.secureAccess.provider = 'Supabase';
    } catch (error) {
      diagnostic.secureAccess.exists = false;
      diagnostic.secureAccess.error = error.message;
    }
    
    // Test email service
    try {
      const emailService = require('./services/emailService');
      // Test if SendGrid is properly configured
      if (process.env.SENDGRID_API_KEY) {
        diagnostic.emailService.connection = 'SUCCESS';
        diagnostic.emailService.provider = 'SendGrid';
        diagnostic.emailService.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@skillyme.com';
      } else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        diagnostic.emailService.connection = 'SUCCESS';
        diagnostic.emailService.provider = 'Gmail SMTP';
        diagnostic.emailService.fromEmail = process.env.GMAIL_USER;
      } else {
        diagnostic.emailService.connection = 'FAILED';
        diagnostic.emailService.error = 'No email service configured (SendGrid or Gmail)';
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
}

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
});