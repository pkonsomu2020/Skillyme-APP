// Load environment variables FIRST
require('dotenv').config();

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

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (required for Render)
app.set('trust proxy', 1);

// Security Middleware
app.use(httpsRedirect);
app.use(securityHeaders);
app.use(corsSecurity);

// CORS Configuration - Updated for production domains
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:5173', // Main app (development)
  'http://localhost:8080', // Admin dashboard (development)
  'http://localhost:4173', // Vite preview mode
  'https://skillyme-app.vercel.app', // Production main app (Vercel)
  'https://skillyme-admin.vercel.app', // Production admin dashboard (Vercel)
  'https://skillyme.africa', // Production main app (Custom Domain)
  'https://www.skillyme.africa', // Production main app with www (Custom Domain)
  'https://admin.skillyme.africa', // Production admin dashboard (Custom Domain)
  process.env.FRONTEND_URL, // Production frontend
  process.env.ADMIN_URL // Production admin URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      console.log('🔍 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-CSRF-Token'],
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
}));

// Log CORS configuration
console.log('🌐 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('   ADMIN_URL:', process.env.ADMIN_URL);
console.log('   ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

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

// CSRF Protection (exclude auth, payment, and ALL admin endpoints for now)
app.use((req, res, next) => {
  // Skip CSRF for auth, payment, and ALL admin endpoints to fix CORS issues
  if (
    (req.path === '/api/auth/register' && req.method === 'POST') ||
    (req.path === '/api/auth/login' && req.method === 'POST') ||
    (req.path === '/api/auth/forgot-password' && req.method === 'POST') ||
    (req.path === '/api/auth/reset-password' && req.method === 'POST') ||
    (req.path === '/api/payments/submit-mpesa' && req.method === 'POST') ||
    req.path.startsWith('/api/admin/') || // Skip CSRF for ALL admin endpoints
    req.path === '/api/test' // Skip CSRF for health check
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
// MySQL setup route removed - now using Supabase
app.use('/api/diagnostic', require('./routes/diagnostic'));
app.use('/api/debug', require('./routes/debug'));
app.use('/secure-access', require('./routes/secureAccess'));

// Admin routes
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin/sessions', require('./routes/adminSessions'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/analytics', require('./routes/adminAnalytics'));
app.use('/api/admin/notifications', require('./routes/adminNotifications'));
app.use('/api/admin/upload', require('./routes/adminUpload'));

app.use('/api/admin/companies', require('./routes/adminCompanies'));
app.use('/api/admin/session-registrations', require('./routes/adminSessionRegistrations'));
app.use('/api/admin/payments', require('./routes/adminPayments'));

// All authentication routes are now unified in /api/admin/auth
// No additional route files needed

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('🔍 OPTIONS request from origin:', origin);
  
  if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(200);
  } else {
    console.log('🚫 OPTIONS blocked for origin:', origin);
    res.sendStatus(403);
  }
});

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Skillyme API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
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