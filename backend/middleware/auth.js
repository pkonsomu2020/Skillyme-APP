const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SECURITY RISK: Weak default JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('❌ CRITICAL: JWT_SECRET not properly configured in auth middleware!');
  process.exit(1);
}

// Verify JWT token (lenient for development)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // SECURITY: Validate token format and decode
    if (!token || typeof token !== 'string') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // SECURITY: Validate decoded token structure
    if (!decoded || !decoded.userId || typeof decoded.userId !== 'number') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token payload' 
      });
    }
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      // User not found
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // User found
    
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      county: user.county
    };
    
    // Authentication successful
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    console.error('Error details:', { name: error.name, message: error.message });
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = { authenticateToken };