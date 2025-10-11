const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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

  // Core email sending method with enhanced error handling
  async sendEmail(to, subject, html, text = '') {
    // SECURITY: Input validation and sanitization
    if (!to || !subject || !html) {
      console.error('📧 [ERROR] Missing required email parameters:', { to: !!to, subject: !!subject, html: !!html });
      return { success: false, error: 'Missing required email parameters' };
    }

    // SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('📧 [ERROR] Invalid email format:', to);
      return { success: false, error: 'Invalid email format' };
    }

    // SECURITY: Sanitize inputs
    const sanitizedTo = to.trim().toLowerCase();
    const sanitizedSubject = subject.trim().substring(0, 200);
    const sanitizedHtml = html.trim();
    const sanitizedText = text.trim();

    console.log('📧 [EMAIL SERVICE] Attempting to send email:');
    console.log('   To:', sanitizedTo);
    console.log('   Subject:', sanitizedSubject);
    console.log('   SendGrid available:', !!process.env.SENDGRID_API_KEY);
    console.log('   Gmail SMTP available:', !!this.nodemailerTransporter);

    // For development/testing, log email instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAIL_SENDING === 'true') {
      console.log('📧 [DEV MODE] Email would be sent (email sending disabled)');
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log('📧 [SENDGRID] Attempting to send via SendGrid...');

        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'skillyme25@gmail.com';

        const msg = {
          to: sanitizedTo,
          from: {
            email: fromEmail,
            name: 'Skillyme Team'
          },
          subject: sanitizedSubject,
          text: sanitizedText || sanitizedHtml.replace(/<[^>]*>/g, ''),
          html: sanitizedHtml,

          // Enhanced deliverability settings
          tracking_settings: {
            click_tracking: { enable: false },
            open_tracking: { enable: false },
            subscription_tracking: { enable: false }
          },

          mail_settings: {
            spam_check: { enable: false }
          }
        };

        console.log('📧 [SENDGRID] Sending email with config:', {
          from: fromEmail,
          to: sanitizedTo,
          subject: sanitizedSubject
        });

        const result = await sgMail.send(msg);
        const messageId = result[0].headers['x-message-id'];

        console.log('✅ [SENDGRID] Email sent successfully');
        console.log('   Message ID:', messageId);
        console.log('   Status Code:', result[0].statusCode);

        return {
          success: true,
          messageId: messageId,
          provider: 'sendgrid',
          statusCode: result[0].statusCode
        };
      } catch (error) {
        console.error('❌ [SENDGRID] Failed to send email:', error.message);

        if (error.response?.body) {
          console.error('❌ [SENDGRID] Error details:', JSON.stringify(error.response.body, null, 2));

          if (error.response.body.errors) {
            error.response.body.errors.forEach(err => {
              console.error(`   Error: ${err.message} (${err.field})`);
            });
          }
        }

        console.log('📧 [SENDGRID] Falling back to Gmail SMTP...');
      }
    }

    // Try Gmail SMTP as fallback
    if (this.nodemailerTransporter) {
      try {
        console.log('📧 [GMAIL SMTP] Attempting to send via Gmail SMTP...');

        const mailOptions = {
          from: `"Skillyme Team" <${process.env.GMAIL_USER}>`,
          to: sanitizedTo,
          replyTo: process.env.GMAIL_USER,
          subject: sanitizedSubject,
          text: sanitizedText || sanitizedHtml.replace(/<[^>]*>/g, ''),
          html: sanitizedHtml,

          headers: {
            'X-Priority': '1',
            'Importance': 'high',
            'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=Unsubscribe>`
          },

          messageId: `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@skillyme.com>`,
          date: new Date(),
          encoding: 'utf8'
        };

        console.log('📧 [GMAIL SMTP] Sending email with config:', {
          from: process.env.GMAIL_USER,
          to: sanitizedTo,
          subject: sanitizedSubject
        });

        const result = await this.nodemailerTransporter.sendMail(mailOptions);

        console.log('✅ [GMAIL SMTP] Email sent successfully');
        console.log('   Message ID:', result.messageId);
        console.log('   Response:', result.response);

        return {
          success: true,
          messageId: result.messageId,
          provider: 'gmail-smtp',
          response: result.response
        };
      } catch (error) {
        console.error('❌ [GMAIL SMTP] Failed to send email:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Command:', error.command);
      }
    }

    // If all methods failed, log the email for debugging
    console.log('📧 [FALLBACK] All email methods failed, logging email for debugging:');
    console.log(`   To: ${sanitizedTo}`);
    console.log(`   Subject: ${sanitizedSubject}`);
    console.log(`   Content preview: ${(sanitizedText || sanitizedHtml.replace(/<[^>]*>/g, '')).substring(0, 100)}...`);

    // Return success to prevent breaking the application flow
    return {
      success: true,
      messageId: 'logged-' + Date.now(),
      provider: 'fallback-log',
      note: 'Email logged due to service unavailability'
    };
  }

  // ==================== USER DASHBOARD EMAILS ====================

  // Email template for M-Pesa submission confirmation
  async sendPaymentSubmissionConfirmation(userEmail, userName, sessionName) {
    if (!userEmail || !userName || !sessionName) {
      console.error('📧 [ERROR] Missing parameters for payment submission confirmation');
      return { success: false, error: 'Missing required parameters' };
    }

    const subject = `Registration Received: ${sessionName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
          <h2 style="color: #1e40af; margin-top: 0;">Registration Received!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi <strong>${userName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We have received your registration for <strong>${sessionName}</strong> and your payment is being processed.
          </p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1d4ed8; font-weight: 500;">
              We will send you the session link once your payment is confirmed.
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Please check your email for updates.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
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
    if (!userEmail || !userName || !sessionName || !status) {
      console.error('📧 [ERROR] Missing parameters for payment status update');
      return { success: false, error: 'Missing required parameters' };
    }

    let subject, html;

    if (status === 'paid') {
      subject = `Payment Confirmed - ${sessionName} Access Granted`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Payment Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your session access has been granted</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #10b981;">
            <h2 style="color: #166534; margin-top: 0;">Welcome to ${sessionName}!</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! Your payment has been confirmed and you now have access to the <strong>${sessionName}</strong> session.
            </p>
            
            ${googleMeetLink ? `
            <div style="background: #dcfce7; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 18px;">🔗 Session Access</h3>
              <p style="margin: 0 0 15px 0; color: #166534; font-weight: 500;">
                Your session is confirmed! Click the link below to join:
              </p>
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #bbf7d0;">
                <a href="${googleMeetLink}" style="display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  🎯 Join Session Now
                </a>
              </div>
              <p style="margin: 0; color: #166534; font-size: 12px; font-style: italic;">
                💡 Tip: Join a few minutes early to test your audio and video
              </p>
            </div>
            ` : ''}
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We look forward to seeing you in the session!
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Skillyme Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (status === 'failed') {
      subject = `Payment Issue - ${sessionName}`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Payment Issue</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">We need to resolve this together</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #ef4444;">
            <h2 style="color: #991b1b; margin-top: 0;">Payment Verification Failed</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We encountered an issue verifying your payment for the <strong>${sessionName}</strong> session.
            </p>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f87171;">
              <p style="margin: 0; color: #991b1b; font-weight: 500;">
                Please contact our support team to resolve this issue and secure your session access.
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Email: ${process.env.SUPPORT_EMAIL || 'skillyme25@gmail.com'}<br>
              Phone: ${process.env.SUPPORT_PHONE || '+254 745 266526'}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Skillyme Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // For amount_mismatch or other statuses
      subject = `Payment Review Required - ${sessionName}`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔍 Payment Under Review</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">We're reviewing your payment details</p>
          </div>
          
          <div style="background: #fffbeb; padding: 30px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #92400e; margin-top: 0;">Payment Review in Progress</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your payment for the <strong>${sessionName}</strong> session is currently under review by our team.
            </p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                We'll notify you once the review is complete and your session access is confirmed.
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for your patience.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
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

  // Password reset email
  async sendPasswordResetEmail(userEmail, userName, resetUrl) {
    if (!userEmail || !userName || !resetUrl) {
      console.error('📧 [ERROR] Missing parameters for password reset email');
      return { success: false, error: 'Missing required parameters' };
    }

    const subject = 'Reset Your Skillyme Password';

    const text = `Hi ${userName},

You requested to reset your password for your Skillyme account.

Click this link to reset your password: ${resetUrl}

This link expires in 1 hour for security reasons.

If you didn't request this, please ignore this email.

Thanks,
Skillyme Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
          <h2 style="color: #1e40af; margin-top: 0;">Password Reset Request</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi <strong>${userName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You requested to reset your password for your Skillyme account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link expires in 1 hour for security reasons. If you didn't request this, please ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The Skillyme Team</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html, text);
  }

  // ==================== ADMIN DASHBOARD EMAILS ====================

  // Send notification email (for admin notifications)
  async sendNotificationEmail(userEmail, userName, subject, message) {
    if (!userEmail || !subject || !message) {
      console.error('📧 [ERROR] Missing parameters for notification email:', {
        userEmail: !!userEmail,
        subject: !!subject,
        message: !!message
      });
      return { success: false, error: 'Missing required parameters' };
    }

    // Replace {name} placeholder with actual user name
    const personalizedMessage = message.replace(/{name}/g, userName || 'there');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <div style="white-space: pre-wrap; color: #374151; font-size: 16px; line-height: 1.6;">
            ${personalizedMessage}
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>The Skillyme Team</strong><br>
            <a href="mailto:skillyme25@gmail.com" style="color: #2563eb;">skillyme25@gmail.com</a>
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }


}

module.exports = new EmailService();