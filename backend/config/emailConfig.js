// Email Configuration for Better Deliverability
// This file contains settings to prevent emails from going to spam

const emailConfig = {
  // SendGrid Configuration
  sendgrid: {
    // Use a verified domain for better deliverability
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@skillyme.com',
    fromName: 'Skillyme Team',
    
    // Email headers to prevent spam
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'Skillyme Platform v1.0',
      'List-Unsubscribe': '<mailto:unsubscribe@skillyme.com>',
      'X-SG-EID': 'skillyme-transaction',
      'X-Entity-Ref-ID': 'skillyme-notification'
    },
    
    // Categories for better organization
    categories: ['transaction', 'skillyme-notification', 'career-session'],
    
    // Custom arguments for tracking
    customArgs: {
      source: 'skillyme-platform',
      type: 'transaction-notification',
      version: '1.0'
    }
  },
  
  // Gmail SMTP Configuration
  gmail: {
    fromEmail: process.env.GMAIL_USER,
    fromName: 'Skillyme Team',
    
    // Headers for Gmail
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'Skillyme Platform v1.0',
      'List-Unsubscribe': '<mailto:unsubscribe@skillyme.com>'
    }
  },
  
  // Email templates configuration
  templates: {
    // Common styles for all emails
    commonStyles: {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f5f5f5',
      maxWidth: '600px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    
    // Brand colors
    brandColors: {
      primary: '#667eea',
      secondary: '#764ba2',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      text: '#333333',
      textLight: '#666666',
      textMuted: '#999999'
    }
  },
  
  // Spam prevention settings
  spamPrevention: {
    // Avoid spam trigger words
    avoidWords: [
      'free', 'win', 'winner', 'congratulations', 'urgent', 'act now',
      'limited time', 'click here', 'buy now', 'save money', 'guaranteed'
    ],
    
    // Use professional language
    professionalLanguage: true,
    
    // Include unsubscribe link
    includeUnsubscribe: true,
    
    // Proper email structure
    properStructure: true
  }
};

module.exports = emailConfig;
