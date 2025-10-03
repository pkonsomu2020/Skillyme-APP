const jwt = require('jsonwebtoken');

// SECURITY RISK: Weak default JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('❌ CRITICAL: JWT_SECRET not properly configured in admin auth!');
  process.exit(1);
}

// Verify admin JWT token
const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin access token required' 
      });
    }

    // SECURITY: Validate token format
    if (!token || typeof token !== 'string') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // SECURITY: Validate admin token structure
    if (!decoded || !decoded.adminId || !decoded.username || !decoded.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token payload' 
      });
    }
    
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    req.admin = {
      id: decoded.adminId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired admin token' 
    });
  }
};

module.exports = { authenticateAdmin };