const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { generalLimiter, authLimiter, paymentLimiter, adminLimiter } = require('./middleware/rateLimiting');
const { securityHeaders, httpsRedirect, corsSecurity } = require('./middleware/securityHeaders');
const { csrfProtection, getCSRFToken, csrfErrorHandler } = require('./middleware/csrfProtection');
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