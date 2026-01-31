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
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:5173', // Main app (development)
  'http://localhost:8080', // Admin dashboard (development)
  'https://skillyme-app.vercel.app', // Production main app
  'https://skillyme-admin.vercel.app', // Production admin dashboard
  process.env.FRONTEND_URL, // Production frontend
  process.env.ADMIN_URL // Production admin URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Log CORS configuration
console.log('🌐 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);

// Rate Limiting
app.use(generalLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing for CSRF
app.use(cookieParser());

// Static file serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CSRF Protection (exclude auth, payment, and admin auth endpoints)
app.use((req, res, next) => {
  // Skip CSRF for specific auth, payment, admin, and user assignment endpoints
  if (
    (req.path === '/api/auth/register' && req.method === 'POST') ||
    (req.path === '/api/auth/login' && req.method === 'POST') ||
    (req.path === '/api/auth/forgot-password' && req.method === 'POST') ||
    (req.path === '/api/auth/reset-password' && req.method === 'POST') ||
    (req.path === '/api/payments/submit-mpesa' && req.method === 'POST') ||
    (req.path === '/api/admin/auth/login' && req.method === 'POST') ||
    (req.path === '/api/admin/auth/simple-login' && req.method === 'POST') ||
    (req.path === '/api/admin/auth/ultra-simple-login' && req.method === 'POST') ||
    (req.path === '/api/admin/auth/clean-login' && req.method === 'POST') ||
    req.path.startsWith('/api/admin/assignments') ||
    req.path.startsWith('/api/admin/sessions') ||
    req.path.startsWith('/api/admin/users') ||
    req.path.startsWith('/api/admin/notifications') ||
    req.path.startsWith('/api/admin/upload') ||
    req.path.startsWith('/api/admin/analytics') ||
    req.path.startsWith('/api/admin/discounts') ||
    req.path.startsWith('/api/admin/session-access') ||
    req.path.startsWith('/api/assignments') ||
    req.path.startsWith('/api/session-access') ||
    req.path.startsWith('/api/dashboard')
  ) {
    return next();
  }
  // Apply CSRF protection to all other routes
  return csrfProtection(req, res, next);
});
app.get('/api/csrf-token', getCSRFToken);

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/payments', paymentLimiter, require('./routes/payment'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/session-access', require('./routes/sessionAccess'));
app.use('/api/assignments', require('./routes/assignments'));
// MySQL setup route removed - now using Supabase
app.use('/api/diagnostic', require('./routes/diagnostic'));
app.use('/secure-access', require('./routes/secureAccess'));

// Admin routes
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin/sessions', require('./routes/adminSessions'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/analytics', require('./routes/adminAnalytics'));
app.use('/api/admin/notifications', require('./routes/adminNotifications'));
app.use('/api/admin/upload', require('./routes/adminUpload'));
app.use('/api/admin/assignments', require('./routes/adminAssignments'));
app.use('/api/admin/discounts', require('./routes/adminDiscounts'));
app.use('/api/admin/session-access', require('./routes/userSessionAccess'));

// All authentication routes are now unified in /api/admin/auth
// No additional route files needed

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

// SECURITY: Development test endpoints removed for production security

// SECURITY: Email test endpoints removed for production security

// SECURITY: Environment variable exposure endpoints removed for production security

// SECURITY: Diagnostic endpoints removed for production security

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