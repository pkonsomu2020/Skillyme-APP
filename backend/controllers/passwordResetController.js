const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const token = PasswordReset.generateToken();
    const expiresAt = PasswordReset.getExpirationTime();

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteByUserId(user.id);

    // Create new reset token
    await PasswordReset.create(user.id, token, expiresAt);

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password/${token}`;
      
      await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
      
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Validate reset token
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    const resetRecord = await PasswordReset.findByToken(token);
    
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: resetRecord.email,
        name: resetRecord.name
      }
    });

  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate token
    const resetRecord = await PasswordReset.findByToken(token);
    
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password
    await User.updatePassword(resetRecord.user_id, hashedPassword);

    // Delete the reset token
    await PasswordReset.deleteByToken(token);

    // Clean up any other expired tokens
    await PasswordReset.cleanupExpired();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  forgotPassword,
  validateResetToken,
  resetPassword
};
