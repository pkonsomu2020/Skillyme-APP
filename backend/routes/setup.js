const express = require('express');
const router = express.Router();

// DEPRECATED: This file is no longer used with Supabase
// Database setup is now handled through Supabase dashboard

// Database setup endpoint (DEPRECATED)
router.get('/setup-database', async (req, res) => {
  res.json({
    success: false,
    message: 'This endpoint is deprecated. Database setup is now handled through Supabase dashboard.',
    instructions: 'Please use the Supabase dashboard to set up your database tables using the supabase-schema.sql file.'
  });
});

// Also support POST method for flexibility (DEPRECATED)
router.post('/setup-database', async (req, res) => {
  res.json({
    success: false,
    message: 'This endpoint is deprecated. Database setup is now handled through Supabase dashboard.',
    instructions: 'Please use the Supabase dashboard to set up your database tables using the supabase-schema.sql file.'
  });
});

// Test admin login endpoint (DEPRECATED)
router.get('/test-admin-login', async (req, res) => {
  res.json({
    success: false,
    message: 'This endpoint is deprecated. Admin authentication is now handled through Supabase.',
    instructions: 'Please use the Supabase dashboard to manage admin users.'
  });
});

// CORS test endpoint (still works)
router.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;