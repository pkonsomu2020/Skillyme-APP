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

    console.log('📧 [EMAIL SERVICE] Attempting to send email to:', sanitizedTo);
    console.log('📧 [EMAIL SERVICE] SendGrid API Key present:', !!process.env.SENDGRID_API_KEY);
    console.log('📧 [EMAIL SERVICE] Gmail SMTP configured:', !!this.nodemailerTransporter);

    // Email sending in progress

    // Send via SendGrid with enhanced deliverability
    if (process.env.SENDGRID_API_KEY) {
      console.log('📧 [SENDGRID] Attempting to send via SendGrid...');
      try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'skillyme25@gmail.com';
        
        const msg = {
          to: sanitizedTo,
          from: fromEmail,
          subject: sanitizedSubject,
          text: sanitizedText || sanitizedHtml.replace(/<[^>]*>/g, ''),
          html: sanitizedHtml,
          
          // Disable all tracking for better deliverability
          tracking_settings: {
            click_tracking: { enable: false },
            open_tracking: { enable: false },
            subscription_tracking: { enable: false }
          },
          
          // Disable spam check to avoid false positives
          mail_settings: {
            spam_check: { enable: false }
          }
        };

        console.log('📧 [SENDGRID] Sending with enhanced deliverability settings');
        console.log('   From:', fromEmail);
        console.log('   To:', sanitizedTo);
        console.log('   Subject:', sanitizedSubject);
        
        const result = await sgMail.send(msg);
        const messageId = result[0].headers['x-message-id'];
        
        console.log('✅ Email sent successfully via SendGrid');
        console.log('   Message ID:', messageId);
        console.log('   Status Code:', result[0].statusCode);
        
        return { 
          success: true, 
          messageId: messageId,
          provider: 'sendgrid',
          statusCode: result[0].statusCode
        };
      } catch (error) {
        console.error('❌ SendGrid failed:', error.message);
        
        if (error.response?.body) {
          console.error('❌ SendGrid error details:', JSON.stringify(error.response.body, null, 2));
          
          // Check for specific SendGrid errors
          const errorBody = error.response.body;
          if (errorBody.errors) {
            errorBody.errors.forEach(err => {
              console.error(`   Error: ${err.message} (${err.field})`);
            });
          }
        }
        
        console.error('❌ SendGrid status code:', error.response?.statusCode);
        
        // Continue to Gmail SMTP fallback
      }
    }

    // Try Gmail SMTP as fallback with enhanced deliverability
    if (this.nodemailerTransporter) {
      console.log('📧 [GMAIL SMTP] Attempting to send via Gmail SMTP...');
      try {
        const mailOptions = {
          from: process.env.GMAIL_USER, // Simple format
          to: sanitizedTo, // Simple format
          replyTo: process.env.GMAIL_USER,
          subject: sanitizedSubject,
          text: sanitizedText || sanitizedHtml.replace(/<[^>]*>/g, ''),
          html: sanitizedHtml,
          
          // Minimal headers for inbox delivery
          headers: {
            'X-Priority': '1',
            'Importance': 'high',
            'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=Unsubscribe>`
          },
          
          // Message options
          messageId: `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@skillyme.com>`,
          date: new Date(),
          encoding: 'utf8'
        };

        console.log('📧 [GMAIL SMTP] Sending with enhanced headers');
        console.log('   From:', process.env.GMAIL_USER);
        console.log('   To:', sanitizedTo);
        console.log('   Subject:', sanitizedSubject);
        
        const result = await this.nodemailerTransporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully via Gmail SMTP');
        console.log('   Message ID:', result.messageId);
        console.log('   Response:', result.response);
        
        return { 
          success: true, 
          messageId: result.messageId,
          provider: 'gmail-smtp',
          response: result.response
        };
      } catch (error) {
        console.error('❌ Gmail SMTP failed:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Command:', error.command);
      }
    }

    // If all methods failed, log the email
    console.log('📧 [FALLBACK] All email methods failed, logging email:');
    console.log(`   To: ${sanitizedTo}`);
    console.log(`   Subject: ${sanitizedSubject}`);
    console.log(`   Content: ${sanitizedText || sanitizedHtml.substring(0, 100)}...`);
    
    const emailLog = {
      timestamp: new Date().toISOString(),
      to: sanitizedTo,
      subject: sanitizedSubject,
      html: sanitizedHtml,
      text: sanitizedText,
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

  // Email template for password reset - Optimized for inbox delivery
  async sendPasswordResetEmail(userEmail, userName, resetUrl) {
    const subject = 'Account access';
    
    // Simple text version for better deliverability
    const text = `Hi ${userName},

Your password reset link: ${resetUrl}

This link expires in 1 hour.

Thanks,
Skillyme Team`;
    
    // Minimal HTML for better deliverability
    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #000;">
        <p>Hi ${userName},</p>
        <p>Your password reset link: <a href="${resetUrl}" style="color: #1a0dab;">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
        <p>Thanks,<br>Skillyme Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html, text);
  }

  // Send booking confirmation email
  async sendBookingConfirmationEmail(userEmail, userName, sessionDetails, amountPaid) {
    const subject = `Booking Confirmed: ${sessionDetails.title}`;
    
    const sessionDate = new Date(sessionDetails.datetime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const sessionTime = new Date(sessionDetails.datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 25px;">
          <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 24px;">🎉 Booking Confirmed!</h2>
          <p style="color: #374151; font-size: 16px; margin: 0;">
            Great news! Your booking has been confirmed and you're all set for the session.
          </p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Session Details</h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Session:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDetails.title}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Company:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDetails.company}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Recruiter:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDetails.recruiter}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Date:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDate}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Time:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionTime}</span>
          </div>
          
          ${amountPaid ? `
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Amount Paid:</strong>
            <span style="color: #059669; margin-left: 10px; font-weight: 600;">KES ${amountPaid.toLocaleString()}</span>
          </div>
          ` : ''}
          
          ${sessionDetails.google_meet_link ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <strong style="color: #374151;">Join Link:</strong>
            <br>
            <a href="${sessionDetails.google_meet_link}" style="color: #2563eb; text-decoration: none; word-break: break-all;">
              ${sessionDetails.google_meet_link}
            </a>
          </div>
          ` : ''}
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">Important Reminders:</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Join the session 5-10 minutes early</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Prepare any questions you'd like to ask</li>
            <li>Have your resume ready if applicable</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
            We're excited to have you join this session!
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The Skillyme Team</strong><br>
              <a href="mailto:support@skillyme.co.ke" style="color: #2563eb;">support@skillyme.co.ke</a>
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  // Send booking reminder email
  async sendBookingReminderEmail(userEmail, userName, sessionDetails, customMessage = '') {
    const subject = `Reminder: ${sessionDetails.title} - Tomorrow`;
    
    const sessionDate = new Date(sessionDetails.datetime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const sessionTime = new Date(sessionDetails.datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Skillyme</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Career Development Platform</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 24px;">⏰ Session Reminder</h2>
          <p style="color: #92400e; font-size: 16px; margin: 0;">
            Hi ${userName}! This is a friendly reminder about your upcoming session.
          </p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Session Details</h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Session:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDetails.title}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Company:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDetails.company}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Date:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionDate}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Time:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${sessionTime}</span>
          </div>
          
          ${sessionDetails.google_meet_link ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <strong style="color: #374151;">Join Link:</strong>
            <br>
            <a href="${sessionDetails.google_meet_link}" style="color: #2563eb; text-decoration: none; word-break: break-all;">
              ${sessionDetails.google_meet_link}
            </a>
          </div>
          ` : ''}
        </div>

        ${customMessage ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 25px;">
          <h4 style="color: #1e40af; margin: 0 0 10px 0;">Special Message:</h4>
          <p style="color: #374151; margin: 0; font-style: italic;">
            "${customMessage}"
          </p>
        </div>
        ` : ''}

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #374151; margin: 0 0 10px 0;">Pre-Session Checklist:</h4>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Test your internet connection</li>
            <li>Prepare your questions</li>
            <li>Join 5-10 minutes early</li>
            <li>Have a quiet environment ready</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
            Looking forward to seeing you there!
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The Skillyme Team</strong><br>
              <a href="mailto:support@skillyme.co.ke" style="color: #2563eb;">support@skillyme.co.ke</a>
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();