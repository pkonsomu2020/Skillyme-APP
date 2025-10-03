const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordValidator = require('../middleware/passwordValidation');
const ErrorHandler = require('../middleware/errorHandler');
const TransactionLogger = require('../middleware/transactionLogger');
const HashIntegrityChecker = require('../middleware/hashIntegrity');

// SECURITY RISK: Weak default JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('❌ CRITICAL: JWT_SECRET not properly configured!');
  process.exit(1);
}
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Register user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Validation failed'), {
        endpoint: '/api/auth/register',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, country, county, field_of_study, institution, level_of_study } = req.body;

    // Enhanced password validation
    const passwordValidation = PasswordValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      await ErrorHandler.logError(new Error('Password validation failed'), {
        endpoint: '/api/auth/register',
        email,
        passwordErrors: passwordValidation.errors
      });
      
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      await ErrorHandler.logError(new Error('User already exists'), {
        endpoint: '/api/auth/register',
        email
      });
      
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password with enhanced security
    const hashedPassword = await PasswordValidator.hashPassword(password);

    // Create user with transaction logging
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      country,
      county,
      field_of_study: field_of_study || 'Not specified',
      institution: institution || 'Not specified',
      level_of_study: level_of_study || 'High School'
    };

    const user = await User.create(userData);
    
    // Log successful registration
    await TransactionLogger.logUserRegistration(userData, user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          country: user.country,
          county: user.county
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/auth/register',
      email: req.body?.email
    });
    
    return ErrorHandler.handleAuthError(error, res);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Login validation failed'), {
        endpoint: '/api/auth/login',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      await ErrorHandler.logError(new Error('User not found'), {
        endpoint: '/api/auth/login',
        email
      });
      
      await TransactionLogger.logUserLogin(email, null, false);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Enhanced password verification with integrity check
    const isPasswordValid = await PasswordValidator.verifyPassword(user.password, password);
    if (!isPasswordValid) {
      await ErrorHandler.logError(new Error('Invalid password'), {
        endpoint: '/api/auth/login',
        email,
        userId: user.id
      });
      
      await TransactionLogger.logUserLogin(email, user.id, false);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Log successful login
    await TransactionLogger.logUserLogin(email, user.id, true);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          country: user.country,
          county: user.county
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/auth/login',
      email: req.body?.email
    });
    
    return ErrorHandler.handleAuthError(error, res);
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, country, county } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;
    if (county) updateData.county = county;

    const updated = await User.update(userId, updateData);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};