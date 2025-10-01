const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const Payment = require('../models/Payment');
const User = require('../models/User');
const emailService = require('../services/emailService');
const SecureAccess = require('../models/SecureAccess');

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
            
            // Fallback to generated link if database link is not available
            if (!googleMeetLink) {
              googleMeetLink = `https://meet.google.com/skillyme-${paymentId}-${Date.now()}`;
              console.log('No Google Meet link found in database, using generated link:', googleMeetLink);
            } else {
              console.log('Using Google Meet link from database:', googleMeetLink);
            }
          }
          
          // Send appropriate email based on status
          if (status === 'paid') {
            // Create secure access for the user
            try {
              const accessToken = await SecureAccess.createSecureAccess(
                payment.user_id,
                payment.session_id
              );
              
              // Create secure access link
              const secureAccessLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/secure-access/${accessToken}`;
              
              // Send confirmation email with secure access link
              await emailService.sendPaymentStatusUpdate(
                payment.user_email,
                payment.user_name,
                sessionName,
                status,
                secureAccessLink
              );
              console.log('Payment confirmation email with secure access sent to:', payment.user_email);
              console.log('Secure access token created:', accessToken);
            } catch (accessError) {
              console.error('Failed to create secure access:', accessError);
              // Fallback to regular Google Meet link
              await emailService.sendPaymentStatusUpdate(
                payment.user_email,
                payment.user_name,
                sessionName,
                status,
                googleMeetLink
              );
              console.log('Payment confirmation email sent to:', payment.user_email);
            }
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

module.exports = {
  adminLogin,
  getAdminProfile,
  getAllPayments,
  updatePaymentStatus
};