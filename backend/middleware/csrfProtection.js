const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// CSRF token endpoint
const getCSRFToken = (req, res) => {
  res.json({ 
    success: true,
    csrfToken: req.csrfToken() 
  });
};

// CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  next(err);
};

module.exports = {
  csrfProtection,
  getCSRFToken,
  csrfErrorHandler
};
