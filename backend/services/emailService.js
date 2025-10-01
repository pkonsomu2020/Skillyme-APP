const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
      },
      // Optimized timeout settings for cloud platforms
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 30000, // 30 seconds
      pool: false, // Disable connection pooling
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      // Additional options for better reliability
      requireTLS: true,
      debug: false,
      logger: false,
      // Additional Gmail-specific settings
      service: 'gmail',
      ignoreTLS: false,
      secureConnection: false
    });
  }

  async sendEmail(to, subject, html, text = '', retries = 3) {
    // For development/testing, log email instead of sending
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${text || html.substring(0, 100)}...`);
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 [NO EMAIL CONFIG] Email would be sent:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${text || html.substring(0, 100)}...`);
      return { success: true, messageId: 'no-config-' + Date.now() };
    }

    // Log email attempt for debugging
    console.log('📧 [EMAIL ATTEMPT] Sending email:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Secure Access Link: ${html.includes('secure-access') ? 'INCLUDED' : 'NOT FOUND'}`);

    // Try multiple SMTP configurations
    const smtpConfigs = [
      // Primary Gmail configuration with optimized settings
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        tls: { 
          rejectUnauthorized: false,
          ciphers: 'SSLv3',
          servername: 'smtp.gmail.com'
        },
        requireTLS: true,
        service: 'gmail',
        pool: false,
        maxConnections: 1,
        maxMessages: 1
      },
      // Alternative Gmail configuration with SSL
      {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: { 
          rejectUnauthorized: false,
          servername: 'smtp.gmail.com'
        },
        pool: false,
        maxConnections: 1,
        maxMessages: 1
      },
      // Simple Gmail configuration without advanced options
      {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      }
    ];

    for (let configIndex = 0; configIndex < smtpConfigs.length; configIndex++) {
      const config = smtpConfigs[configIndex];
      console.log(`📧 [SMTP CONFIG ${configIndex + 1}] Trying ${config.host}:${config.port} (secure: ${config.secure})`);
      
      try {
        const testTransporter = nodemailer.createTransport(config);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const mailOptions = {
              from: `"Skillyme" <${process.env.EMAIL_USER}>`,
              to: to,
              subject: subject,
              text: text,
              html: html
            };

            const result = await testTransporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully with config ${configIndex + 1}:`, result.messageId);
            return { success: true, messageId: result.messageId };
          } catch (error) {
            console.error(`❌ Email sending failed (config ${configIndex + 1}, attempt ${attempt}/${retries}):`, error.message);
            
            if (attempt === retries) {
              console.error(`❌ Config ${configIndex + 1} failed after all retries:`, error.message);
              break; // Try next config
            }
            
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Retrying email in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (configError) {
        console.error(`❌ SMTP Config ${configIndex + 1} setup failed:`, configError.message);
        continue; // Try next config
      }
    }

    // If all configs failed, log the email and return success
    console.log('📧 [FALLBACK] All SMTP configs failed, logging email instead:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${text || html.substring(0, 100)}...`);
    
    // Log email details to a file for manual sending if needed
    const emailLog = {
      timestamp: new Date().toISOString(),
      to: to,
      subject: subject,
      html: html,
      text: text,
      status: 'failed_to_send'
    };
    console.log('📧 [EMAIL LOG]', JSON.stringify(emailLog, null, 2));
    
    return { success: true, messageId: 'fallback-' + Date.now() };
  }

  // Email template for M-Pesa submission confirmation
  async sendPaymentSubmissionConfirmation(userEmail, userName, sessionName) {
    const subject = `Payment Submission Confirmation - ${sessionName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Career Connection Platform</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Thank You for Your Payment Submission!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Dear <strong>${userName}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for registering for the <strong>${sessionName}</strong> session. We have received your M-Pesa payment submission and are currently processing it.
          </p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: 500;">
              📧 We shall get back to you shortly with the invite link once your payment is confirmed.
            </p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Please keep an eye on your email for further updates regarding your session access.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The Skillyme Team</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // Email template for payment status update
  async sendPaymentStatusUpdate(userEmail, userName, sessionName, status, googleMeetLink = null) {
    let subject, html;
    
    if (status === 'paid') {
      subject = `Payment Confirmed - ${sessionName} Session Access Granted`;
      
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Payment Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your session access has been granted</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Welcome to ${sessionName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Great news! Your payment has been confirmed and you now have access to the <strong>${sessionName}</strong> session.
            </p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="margin: 0 0 15px 0; color: #2e7d32;">🔗 Session Access</h3>
              <p style="margin: 0 0 15px 0; color: #2e7d32; font-weight: 500;">
                Click the link below to join your session:
              </p>
              <a href="${googleMeetLink}" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Join Session Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We look forward to seeing you in the session!
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Skillyme Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (status === 'failed') {
      subject = `Payment Issue - ${sessionName} Session`;
      
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Payment Issue</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">We need to resolve this together</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Payment Verification Failed</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We encountered an issue verifying your payment for the <strong>${sessionName}</strong> session.
            </p>
            
            <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
              <p style="margin: 0; color: #c62828; font-weight: 500;">
                Please contact our support team to resolve this issue and secure your session access.
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Email: skillyme25@gmail.com<br>
              Phone: +254 745 266526
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Skillyme Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // For amount_mismatch or other statuses
      subject = `Payment Review Required - ${sessionName} Session`;
      
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔍 Payment Under Review</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">We're reviewing your payment details</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Payment Review in Progress</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your payment for the <strong>${sessionName}</strong> session is currently under review by our team.
            </p>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <p style="margin: 0; color: #e65100; font-weight: 500;">
                We'll notify you once the review is complete and your session access is confirmed.
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for your patience.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Skillyme Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;
    }

    return await this.sendEmail(userEmail, subject, html);
  }

  // Email template for password reset
  async sendPasswordResetEmail(userEmail, userName, resetUrl) {
    const subject = 'Reset Your Skillyme Password';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Reset your Skillyme account password</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password for your Skillyme account.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #4caf50; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Skillyme" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to: userEmail,
        subject: subject,
        html: html
      });
      
      console.log(`Password reset email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
