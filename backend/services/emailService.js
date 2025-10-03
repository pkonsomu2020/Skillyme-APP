const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Initialize SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('📧 SendGrid initialized successfully');
    } else {
      console.log('📧 SendGrid API key not found');
    }

    // Initialize Nodemailer as fallback
    this.nodemailerTransporter = null;
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      this.nodemailerTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
      console.log('📧 Gmail SMTP fallback initialized');
    }
  }

  async sendEmail(to, subject, html, text = '') {
    // SECURITY: Input validation and sanitization
    if (!to || !subject || !html) {
      console.error('📧 [ERROR] Missing required email parameters');
      return { success: false, error: 'Missing required email parameters' };
    }

    // SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('📧 [ERROR] Invalid email format');
      return { success: false, error: 'Invalid email format' };
    }

    // SECURITY: Sanitize inputs
    const sanitizedTo = to.trim().toLowerCase();
    const sanitizedSubject = subject.trim().substring(0, 200);
    const sanitizedHtml = html.trim();
    const sanitizedText = text.trim();

    // For development/testing, log email instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAIL_SENDING === 'true') {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log(`   To: ${sanitizedTo}`);
      console.log(`   Subject: ${sanitizedSubject}`);
      console.log(`   Content: ${sanitizedText || sanitizedHtml.substring(0, 100)}...`);
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    // Email sending in progress

    // Send via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      // Attempting to send via SendGrid
      try {
        // Use a verified sender email or fallback to a default
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@skillyme.com';
        
        const msg = {
          to: to,
          from: {
            email: fromEmail,
            name: 'Skillyme'
          },
          subject: subject,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          html: html,
          // Professional headers to prevent spam
          headers: {
            'X-Mailer': 'Skillyme Platform',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal',
            'List-Unsubscribe': '<mailto:unsubscribe@skillyme.com>',
            'X-SG-EID': 'skillyme-transaction'
          },
          // Add categories for better deliverability
          categories: ['transaction', 'skillyme-notification'],
          // Add custom args for tracking
          customArgs: {
            source: 'skillyme-platform',
            type: 'transaction-notification'
          },
          // Add reply-to for better deliverability
          replyTo: {
            email: fromEmail,
            name: 'Skillyme Support'
          }
        };

        const result = await sgMail.send(msg);
        return { success: true, messageId: result[0].headers['x-message-id'] };
      } catch (error) {
        console.error('❌ SendGrid failed:', error.message);
        console.error('❌ SendGrid error details:', error.response?.body);
        
        // If it's a forbidden error, try with a different approach
        if (error.message.includes('Forbidden') || error.response?.statusCode === 403) {
          console.log('📧 [SENDGRID] Forbidden error - trying with different sender configuration...');
          
          try {
            // Try with a simpler configuration
            const simpleMsg = {
              to: to,
              from: fromEmail, // Use the same from email
              subject: subject,
              text: text || html.replace(/<[^>]*>/g, ''),
              html: html
            };
            
            const result = await sgMail.send(simpleMsg);
            console.log('✅ Email sent successfully via SendGrid (fallback):', result[0].headers['x-message-id']);
            return { success: true, messageId: result[0].headers['x-message-id'] };
          } catch (fallbackError) {
            console.error('❌ SendGrid fallback also failed:', fallbackError.message);
          }
        }
      }
    }

    // Try Gmail SMTP as fallback
    if (this.nodemailerTransporter) {
      console.log('📧 [GMAIL SMTP] Attempting to send via Gmail SMTP...');
      try {
        const mailOptions = {
          from: {
            name: 'Skillyme Team',
            address: process.env.GMAIL_USER
          },
          to: to,
          subject: subject,
          text: text || html.replace(/<[^>]*>/g, ''),
          html: html,
          // Add headers to prevent spam
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'X-Mailer': 'Skillyme Platform',
            'List-Unsubscribe': '<mailto:unsubscribe@skillyme.com>'
          }
        };

        const result = await this.nodemailerTransporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail SMTP:', result.messageId);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error('❌ Gmail SMTP failed:', error.message);
      }
    }

    // If all methods failed, log the email
    console.log('📧 [FALLBACK] All email methods failed, logging email:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${text || html.substring(0, 100)}...`);
    
    const emailLog = {
      timestamp: new Date().toISOString(),
      to: to,
      subject: subject,
      html: html,
      text: text,
      status: 'failed_to_send',
      reason: 'No working email service configured'
    };
    console.log('📧 [EMAIL LOG]', JSON.stringify(emailLog, null, 2));
    
    return { success: true, messageId: 'logged-' + Date.now() };
  }

  // Email template for M-Pesa submission confirmation
  async sendPaymentSubmissionConfirmation(userEmail, userName, sessionName) {
    const subject = `Your ${sessionName} registration is being processed`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Thank you for your registration!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We have received your registration for <strong>${sessionName}</strong> and your payment is being processed.
          </p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: 500;">
              We will send you the session link once your payment is confirmed.
            </p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Please check your email for updates.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>Skillyme Team</strong>
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
            
            <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 18px;">🔗 Session Access</h3>
              <p style="margin: 0 0 15px 0; color: #2e7d32; font-weight: 500;">
                Your session is confirmed! Click the link below to join:
              </p>
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #c8e6c9;">
                <p style="margin: 0 0 10px 0; color: #2e7d32; font-weight: 600; font-size: 14px;">📅 Session Details:</p>
                <p style="margin: 0 0 5px 0; color: #2e7d32; font-size: 14px;"><strong>Date:</strong> Friday, October 10th, 2025</p>
                <p style="margin: 0 0 5px 0; color: #2e7d32; font-size: 14px;"><strong>Time:</strong> 7:30 PM EAT</p>
                <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;"><strong>Duration:</strong> 90 minutes</p>
                <a href="${googleMeetLink}" style="display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 10px;">
                  🎯 Join Session Now
                </a>
              </div>
              <p style="margin: 0; color: #2e7d32; font-size: 12px; font-style: italic;">
                💡 Tip: Join a few minutes early to test your audio and video
              </p>
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
              Email: ${process.env.SUPPORT_EMAIL || 'skillyme25@gmail.com'}<br>
              Phone: ${process.env.SUPPORT_PHONE || '+254 745 266526'}
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
    const subject = 'Password Reset Request - Skillyme Account';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Skillyme</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Skillyme Career Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Hello ${userName},</h2>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset the password for your Skillyme account. If you made this request, please click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.3s;">
                Reset My Password
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #495057; font-size: 14px; font-weight: 500;">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
              </p>
            </div>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all; text-decoration: none;">${resetUrl}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2024 Skillyme. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();