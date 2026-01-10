const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔍 [PASSWORD RESET DEBUG] Starting forgot password for:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('🔍 [PASSWORD RESET DEBUG] User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    console.log('🔍 [PASSWORD RESET DEBUG] User found:', user.id);

    // Generate reset token
    const token = PasswordReset.generateToken();
    const expiresAt = PasswordReset.getExpirationTime();

    console.log('🔍 [PASSWORD RESET DEBUG] Generated token:', token);
    console.log('🔍 [PASSWORD RESET DEBUG] Expires at:', expiresAt);

    // Try to delete any existing reset tokens for this user
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Deleting existing tokens for user:', user.id);
      await PasswordReset.deleteByUserId(user.id);
      console.log('✅ [PASSWORD RESET DEBUG] Existing tokens deleted successfully');
    } catch (deleteError) {
      console.log('⚠️ [PASSWORD RESET DEBUG] Could not delete existing reset tokens:', deleteError.message);
      // Continue anyway - this is not critical
    }

    // Create new reset token
    let resetTokenCreated = false;
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Creating new reset token...');
      await PasswordReset.create(user.id, token, expiresAt);
      resetTokenCreated = true;
      console.log('✅ [PASSWORD RESET DEBUG] Reset token created successfully');
    } catch (resetError) {
      console.log('❌ [PASSWORD RESET DEBUG] Password reset token creation failed:', resetError.message);
      
      // If database operations fail, we can still provide a temporary solution
      // by generating a JWT token that contains the reset information
      console.log('🔄 [PASSWORD RESET DEBUG] Falling back to JWT-based reset token');
      
      // For now, return an error since we need the database for security
      return res.status(500).json({
        success: false,
        message: 'Unable to generate password reset token. Please try again later.',
        debug: process.env.NODE_ENV === 'development' ? resetError.message : undefined
      });
    }

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://skillyme.africa'}/reset-password/${token}`;
      console.log('🔍 [PASSWORD RESET DEBUG] Reset URL:', resetUrl);
      
      await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
      console.log('✅ [PASSWORD RESET DEBUG] Password reset email sent successfully');
    } catch (emailError) {
      console.log('⚠️ [PASSWORD RESET DEBUG] Email sending failed:', emailError.message);
      // Don't fail the request if email fails - provide the link directly
    }

    // Always provide the reset link in the response for development/testing
    const resetUrl = `${process.env.FRONTEND_URL || 'https://skillyme.africa'}/reset-password/${token}`;
    
    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      data: {
        resetUrl: resetUrl,
        note: 'Please save this link to reset your password. It will expire in 1 hour.',
        debug: process.env.NODE_ENV === 'development' ? {
          userId: user.id,
          token: token,
          expiresAt: expiresAt
        } : undefined
      }
    });

    console.log('✅ [PASSWORD RESET DEBUG] Forgot password process completed successfully');

  } catch (error) {
    console.error('❌ [PASSWORD RESET DEBUG] Forgot password failed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    // PERFORMANCE: Removed excessive error logging
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
    // PERFORMANCE: Removed excessive error logging
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
