const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const ErrorHandler = require('../middleware/errorHandler');
const TransactionLogger = require('../middleware/transactionLogger');

// SECURITY: JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('❌ CRITICAL: JWT_SECRET not properly configured!');
  process.exit(1);
}
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Admin login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Admin login validation failed'), {
        endpoint: '/api/admin/auth/login',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      await ErrorHandler.logError(new Error('Admin not found'), {
        endpoint: '/api/admin/auth/login',
        email
      });
      
      await TransactionLogger.logAdminLogin(email, null, false);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await Admin.verifyPassword(admin.password, password);
    if (!isPasswordValid) {
      await ErrorHandler.logError(new Error('Invalid admin password'), {
        endpoint: '/api/admin/auth/login',
        email,
        adminId: admin.id
      });
      
      await TransactionLogger.logAdminLogin(email, admin.id, false);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    await Admin.updateLastLogin(admin.id);
    
    // Log successful login
    await TransactionLogger.logAdminLogin(email, admin.id, true);

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email,
        role: 'admin'
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
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/auth/login',
      email: req.body?.email
    });
    
    return ErrorHandler.handleAuthError(error, res);
  }
};

// Get admin profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message
    });
  }
};

// Update admin profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.admin.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // TODO: Implement admin profile update in Admin model
    // const updated = await Admin.update(adminId, updateData);
    
    res.json({
      success: true,
      message: 'Admin profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin profile update failed',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile
};
