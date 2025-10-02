const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const Payment = require('../models/Payment');
const User = require('../models/User');
const emailService = require('../services/emailService');
const SecureAccess = require('../models/SecureAccess');

// In-memory cache to prevent duplicate requests
const requestCache = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin
    const query = 'SELECT * FROM admins WHERE username = ?';
    const result = await pool.execute(query, [username]);
    const rows = result[0];
    
    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        role: 'super_admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: error.message
    });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message
    });
  }
};

// Get all payments for admin dashboard
const getAllPayments = async (req, res) => {
  try {
    console.log('Fetching all payments for admin dashboard');
    const payments = await Payment.getAllPayments();
    console.log('Payments fetched from database:', payments);
    
    res.json({
      success: true,
      data: {
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'amount_mismatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Create a unique request key to prevent duplicates
    const requestKey = `${paymentId}-${status}-${Date.now()}`;
    const cacheKey = `payment-${paymentId}-${status}`;
    
    // Check if this exact request was made recently (within 5 seconds)
    if (requestCache.has(cacheKey)) {
      const lastRequest = requestCache.get(cacheKey);
      if (Date.now() - lastRequest < 5000) { // 5 seconds
        console.log('Duplicate payment status update request detected, ignoring');
        return res.json({
          success: true,
          message: 'Payment status already updated recently'
        });
      }
    }
    
    // Store this request in cache
    requestCache.set(cacheKey, Date.now());
    
    // Clean up old cache entries (older than 30 seconds)
    for (const [key, timestamp] of requestCache.entries()) {
      if (Date.now() - timestamp > 30000) {
        requestCache.delete(key);
      }
    }

    const updated = await Payment.updateStatus(paymentId, status, adminNotes);
    
    if (updated) {
      // Send email notification to user about status update
      try {
        // Get payment details with user information
        const payments = await Payment.getAllPayments();
        const payment = payments.find(p => p.payment_id == paymentId);
        
        if (payment && payment.user_email) {
          const sessionName = payment.session_title || "Law Career Session";
          let googleMeetLink = null;
          
          // Use Google Meet link from database if payment is approved
          if (status === 'paid') {
            googleMeetLink = payment.session_google_meet_link;
            
            // Fallback to the actual Google Meet link if database link is not available
            if (!googleMeetLink) {
              googleMeetLink = 'https://meet.google.com/nmh-nfxk-oao';
              console.log('No Google Meet link found in database, using default link:', googleMeetLink);
            } else {
              console.log('Using Google Meet link from database:', googleMeetLink);
            }
          }
          
          // Send appropriate email based on status (with rate limiting)
          const emailCacheKey = `email-${payment.user_email}-${status}`;
          const lastEmailSent = requestCache.get(emailCacheKey);
          
          // Only send email if not sent recently (within 30 seconds)
          if (!lastEmailSent || Date.now() - lastEmailSent > 30000) {
            if (status === 'paid') {
              // Send confirmation email with Google Meet link
              console.log('Attempting to send payment confirmation email to:', payment.user_email);
              const emailResult = await emailService.sendPaymentStatusUpdate(
                payment.user_email,
                payment.user_name,
                sessionName,
                status,
                googleMeetLink
              );
              console.log('Payment confirmation email result:', emailResult);
              console.log('Payment confirmation email with Google Meet link sent to:', payment.user_email);
            } else if (status === 'pending') {
              // Send submission confirmation email
              await emailService.sendPaymentSubmissionConfirmation(
                payment.user_email,
                payment.user_name,
                sessionName
              );
              console.log('Payment submission confirmation email sent to:', payment.user_email);
            } else {
              // Send status update email for other statuses
              await emailService.sendPaymentStatusUpdate(
                payment.user_email,
                payment.user_name,
                sessionName,
                status,
                null
              );
              console.log('Payment status update email sent to:', payment.user_email);
            }
            
            // Cache this email send
            requestCache.set(emailCacheKey, Date.now());
          } else {
            console.log('Email already sent recently for this user and status, skipping');
          }
        }
      } catch (emailError) {
        console.error('Failed to send payment status update email:', emailError);
        // Don't fail the request if email fails
      }
      
      res.json({
        success: true,
        message: 'Payment status updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// Get all sessions for admin management
const getAllSessions = async (req, res) => {
  try {
    console.log('📋 Fetching all sessions for admin...');
    
    const [sessions] = await pool.execute(`
      SELECT 
        id, title, description, date, time, google_meet_link,
        recruiter, company, price, paybill_number, business_number,
        is_active, created_at, updated_at
      FROM sessions 
      ORDER BY created_at DESC
    `);

    console.log(`✅ Found ${sessions.length} sessions`);
    
    res.json({
      success: true,
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// Create new session
const createSession = async (req, res) => {
  try {
    const {
      title, description, date, time, duration, google_meet_link,
      recruiter, company, price, paybill_number, business_number
    } = req.body;

    // Validate required fields
    if (!title || !date || !time || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, time, and price are required'
      });
    }

    const query = `
      INSERT INTO sessions (
        title, description, date, time, duration, google_meet_link,
        recruiter, company, price, paybill_number, business_number,
        is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    const values = [
      title, description, date, time, duration || 90, google_meet_link,
      recruiter || 'Skillyme Team', company || 'Skillyme', price,
      paybill_number || '714888', business_number || '272177'
    ];

    const result = await pool.execute(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: {
        sessionId: result[0].insertId
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(sessionId);

    const query = `UPDATE sessions SET ${fields}, updated_at = NOW() WHERE id = ?`;
    
    const result = await pool.execute(query, values);
    
    if (result[0].affectedRows > 0) {
      res.json({
        success: true,
        message: 'Session updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  getAllPayments,
  updatePaymentStatus,
  getAllSessions,
  createSession,
  updateSession
};