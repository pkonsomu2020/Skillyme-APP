const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;

// ========================================
// MAIN ADMIN AUTHENTICATION MIDDLEWARE
// ========================================

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if admin exists
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Admin authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// ========================================
// ALTERNATIVE AUTHENTICATION MIDDLEWARES
// ========================================

// Simple authentication - minimal validation
const simpleAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Ultra simple authentication - no complex validation
const ultraSimpleAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin' });
    }

    req.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Auth failed' });
  }
};

// Clean authentication - bypasses all complex checks
const cleanAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.admin = { 
      id: admin.id, 
      name: admin.name, 
      email: admin.email, 
      role: admin.role 
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = { 
  // Main authentication middleware
  authenticateAdmin,
  
  // Alternative authentication middlewares
  simpleAuth,
  ultraSimpleAuth,
  cleanAuth
};