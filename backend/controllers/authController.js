const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordValidator = require('../middleware/passwordValidation');
const ErrorHandler = require('../middleware/errorHandler');
const TransactionLogger = require('../middleware/transactionLogger');

// SECURITY: Strong JWT secret validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('❌ CRITICAL: JWT_SECRET must be at least 32 characters and properly configured!');
  process.exit(1);
}

// Register user
const register = async (req, res) => {
  try {
    console.log('🔍 [REGISTER] Incoming request body:', {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : 'MISSING'
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [REGISTER] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    console.log('✅ [REGISTER] Express validation passed');

    // Extract ALL fields that match CSV columns
    const { 
      name, email, password, phone, country, county, field_of_study, institution, level_of_study,
      preferred_name, date_of_birth, course_of_study, degree, year_of_study,
      primary_field_interest, signup_source
    } = req.body;

    // Enhanced password validation
    console.log('🔍 [REGISTER] Validating password...');
    const passwordValidation = PasswordValidator.validatePassword(password);
    console.log('🔍 [REGISTER] Password validation result:', passwordValidation);
    
    if (!passwordValidation.isValid) {
      console.log('❌ [REGISTER] Password validation failed:', passwordValidation.errors);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    console.log('🔍 [REGISTER] Checking if user exists:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ [REGISTER] User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    console.log('✅ [REGISTER] User does not exist, proceeding with registration');

    // Hash password with enhanced security
    const hashedPassword = await PasswordValidator.hashPassword(password);

    // Create user data matching CSV structure exactly
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      country,
      county,
      field_of_study,
      institution,
      level_of_study,
      preferred_name,
      date_of_birth,
      course_of_study,
      degree,
      year_of_study,
      primary_field_interest,
      signup_source
    };

    console.log('🔍 [REGISTER] Creating user with data:', {
      ...userData,
      password: '[REDACTED]'
    });

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
      JWT_SECRET
    );

    console.log('✅ [REGISTER] Registration successful for user ID:', user.id);

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
          county: user.county,
          field_of_study: user.field_of_study,
          institution: user.institution,
          level_of_study: user.level_of_study,
          preferred_name: user.preferred_name,
          date_of_birth: user.date_of_birth,
          course_of_study: user.course_of_study,
          degree: user.degree,
          year_of_study: user.year_of_study,
          primary_field_interest: user.primary_field_interest,
          signup_source: user.signup_source,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error('❌ [REGISTER] Registration error:', error);
    
    await ErrorHandler.logError(error, {
      endpoint: '/api/auth/register',
      email: req.body?.email
    });
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      console.log(`❌ Login failed for ${email}: User not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Enhanced password verification
    let isPasswordValid = false;
    
    try {
      isPasswordValid = await PasswordValidator.verifyPassword(user.password, password);
    } catch (verificationError) {
      console.log(`❌ Password verification error for ${email}:`, verificationError.message);
      isPasswordValid = false;
    }
    
    if (!isPasswordValid) {
      console.log(`❌ Login failed for ${email}: Invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log(`✅ Login successful for ${email}`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'user'
      },
      JWT_SECRET
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
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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