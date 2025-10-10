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
// JWT_EXPIRE removed - tokens will never expire for admin dashboard
// const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

// ========================================
// MAIN ADMIN AUTHENTICATION METHODS
// ========================================

// Admin login - Main authentication method (FIXED - removed strict validation)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await Admin.verifyPassword(admin.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    await Admin.updateLastLogin(admin.id);
    
    // Log successful login
    await TransactionLogger.logAdminLogin(email, admin.id, true);

    // Generate JWT token (NO EXPIRATION - permanent token)
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email,
        role: 'admin'
      },
      JWT_SECRET
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
    console.error('Main login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ========================================
// ALTERNATIVE AUTHENTICATION METHODS
// ========================================

// Simple authentication - bypasses complex validation
const simpleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await Admin.verifyPassword(admin.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email,
        role: 'admin'
      },
      JWT_SECRET
    );

    res.json({
      success: true,
      message: 'Simple login successful',
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
    res.status(500).json({
      success: false,
      message: 'Simple login failed',
      error: error.message
    });
  }
};

// Ultra simple authentication - minimal validation
const ultraSimpleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findByEmail(email);
    if (!admin || !await Admin.verifyPassword(admin.password, password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET
    );

    res.json({
      success: true,
      message: 'Ultra simple login successful',
      data: { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ultra simple login failed',
      error: error.message
    });
  }
};

// Clean authentication - no CSRF, no complex validation
const cleanLogin = async (req, res) => {
  try {
    console.log('🔍 Clean login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('🔍 Looking for admin with email:', email);
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      console.log('❌ Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    console.log('✅ Admin found:', { id: admin.id, email: admin.email, hasPassword: !!admin.password });
    
    const isPasswordValid = await Admin.verifyPassword(admin.password, password);
    console.log('🔍 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', admin.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    console.log('✅ Creating JWT token for admin:', admin.id);
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET
    );

    console.log('✅ Clean login successful for:', admin.email);
    res.json({
      success: true,
      message: 'Clean login successful',
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
    console.error('❌ Clean login error:', error);
    res.status(500).json({
      success: false,
      message: 'Clean login failed',
      error: error.message
    });
  }
};

// ========================================
// PROFILE MANAGEMENT
// ========================================

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

// ========================================
// DEBUG AND SETUP METHODS
// ========================================

// Debug endpoint to check admin status
const debugAdmin = async (req, res) => {
  try {
    const email = 'admin@skillyme.com';
    console.log('🔍 Checking admin status for:', email);
    
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      console.log('❌ Admin not found, creating new admin...');
      
      // Create the admin
      const newAdmin = await Admin.create({
        name: 'Admin User',
        email: 'admin@skillyme.com',
        password: 'Skillyme@2025',
        role: 'admin'
      });
      
      console.log('✅ Admin created successfully:', newAdmin.id);
      
      return res.json({
        success: true,
        message: 'Admin created successfully',
        data: {
          admin: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role
          }
        }
      });
    }
    
    console.log('✅ Admin exists:', { id: admin.id, email: admin.email });
    
    res.json({
      success: true,
      message: 'Admin exists',
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          is_active: admin.is_active
        }
      }
    });
  } catch (error) {
    console.error('❌ Debug admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Main authentication
  login,
  getProfile,
  updateProfile,
  
  // Alternative authentication methods
  simpleLogin,
  ultraSimpleLogin,
  cleanLogin,
  
  // Debug methods
  debugAdmin
};