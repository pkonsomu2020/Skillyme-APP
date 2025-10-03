const SecureAccess = require('../models/SecureAccess');

/**
 * Verify secure access token and redirect to Google Meet
 */
const verifySecureAccess = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email verification is required'
      });
    }
    
    // Verify access token
    const verification = await SecureAccess.verifyAccessToken(token, email);
    
    if (!verification.valid) {
      return res.status(403).json({
        success: false,
        message: verification.message || 'Access denied'
      });
    }
    
    // Return session information and Google Meet link
    res.json({
      success: true,
      message: 'Access granted',
      data: {
        user: {
          name: verification.user.name,
          email: verification.user.email
        },
        session: {
          title: verification.session.title,
          google_meet_link: verification.session.google_meet_link
        },
        access_token: token,
        expires_at: verification.user.expires_at
      }
    });
    
  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Access verification failed'
    });
  }
};

/**
 * Get secure access page (for frontend)
 */
const getSecureAccessPage = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head><title>Access Denied - Skillyme</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Access Denied</h1>
            <p>Invalid access token. Please contact support.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}">Return to Skillyme</a>
          </body>
        </html>
      `);
    }
    
    // Return HTML page for secure access
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Access - Skillyme</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
          button { background: #3B82F6; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; width: 100%; }
          button:hover { background: #2563EB; }
          .error { color: #EF4444; margin-top: 10px; }
          .success { color: #10B981; margin-top: 10px; }
          .session-info { background: #F3F4F6; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒 Skillyme Secure Access</div>
            <p>Verify your email to access your session</p>
          </div>
          
          <form id="accessForm">
            <div class="form-group">
              <label for="email">Email Address:</label>
              <input type="email" id="email" name="email" placeholder="Enter your email address" required>
            </div>
            
            <button type="submit">Verify Access</button>
          </form>
          
          <div id="error" class="error" style="display: none;"></div>
          <div id="success" class="success" style="display: none;"></div>
          
          <div id="sessionInfo" class="session-info" style="display: none;">
            <h3>🎉 Access Granted!</h3>
            <p><strong>Session:</strong> <span id="sessionTitle"></span></p>
            <p><strong>Welcome:</strong> <span id="userName"></span></p>
            <a href="#" id="meetLink" target="_blank" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              Join Google Meet Session
            </a>
          </div>
        </div>
        
        <script>
          document.getElementById('accessForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const token = '${token}';
            
            try {
              const response = await fetch('/api/secure-access/' + token + '?email=' + encodeURIComponent(email));
              const data = await response.json();
              
              if (data.success) {
                document.getElementById('error').style.display = 'none';
                document.getElementById('success').style.display = 'block';
                document.getElementById('success').textContent = 'Access verified successfully!';
                
                document.getElementById('sessionTitle').textContent = data.data.session.title;
                document.getElementById('userName').textContent = data.data.user.name;
                document.getElementById('meetLink').href = data.data.session.google_meet_link;
                document.getElementById('sessionInfo').style.display = 'block';
              } else {
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = data.message;
                document.getElementById('success').style.display = 'none';
                document.getElementById('sessionInfo').style.display = 'none';
              }
            } catch (error) {
              document.getElementById('error').style.display = 'block';
              document.getElementById('error').textContent = 'Verification failed. Please try again.';
              document.getElementById('success').style.display = 'none';
              document.getElementById('sessionInfo').style.display = 'none';
            }
          });
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).send(`
      <html>
        <head><title>Error - Skillyme</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Error</h1>
          <p>Something went wrong. Please try again later.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}">Return to Skillyme</a>
        </body>
      </html>
    `);
  }
};

module.exports = {
  verifySecureAccess,
  getSecureAccessPage
};
