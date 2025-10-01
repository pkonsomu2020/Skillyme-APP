const pool = require('./config/database');

async function diagnosticEmail() {
  console.log('🔍 EMAIL DIAGNOSTIC REPORT');
  console.log('==========================');
  
  try {
    // 1. Check environment variables
    console.log('\n📧 EMAIL ENVIRONMENT VARIABLES:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    
    // 2. Test database connection
    console.log('\n🗄️ DATABASE CONNECTION:');
    try {
      await pool.execute('SELECT 1 as test');
      console.log('✅ Database connection: SUCCESS');
    } catch (error) {
      console.log('❌ Database connection: FAILED');
      console.log('Error:', error.message);
    }
    
    // 3. Check if secure_access table exists and its structure
    console.log('\n🔐 SECURE_ACCESS TABLE:');
    try {
      const [rows] = await pool.execute('DESCRIBE secure_access');
      console.log('✅ Table exists with columns:');
      rows.forEach(row => {
        console.log(`   - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ secure_access table: NOT FOUND');
      console.log('Error:', error.message);
    }
    
    // 4. Test email service configuration
    console.log('\n📬 EMAIL SERVICE TEST:');
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        pool: false,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Test connection
      await transporter.verify();
      console.log('✅ Email service: CONNECTION SUCCESS');
    } catch (error) {
      console.log('❌ Email service: CONNECTION FAILED');
      console.log('Error:', error.message);
    }
    
    // 5. Test SecureAccess model
    console.log('\n🔑 SECURE ACCESS MODEL TEST:');
    try {
      const SecureAccess = require('./models/SecureAccess');
      
      // Test creating secure access
      const token = await SecureAccess.createSecureAccess(1, 1);
      console.log('✅ SecureAccess model: SUCCESS');
      console.log('Generated token:', token ? 'YES' : 'NO');
      
      // Clean up test token
      await pool.execute('DELETE FROM secure_access WHERE access_token = ?', [token]);
      console.log('✅ Test token cleaned up');
    } catch (error) {
      console.log('❌ SecureAccess model: FAILED');
      console.log('Error:', error.message);
    }
    
    // 6. Test email sending
    console.log('\n📧 EMAIL SENDING TEST:');
    try {
      const emailService = require('./services/emailService');
      
      const result = await emailService.sendPaymentStatusUpdate(
        'test@example.com',
        'Test User',
        'Test Session',
        'paid',
        'https://meet.google.com/test'
      );
      
      console.log('✅ Email sending: SUCCESS');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ Email sending: FAILED');
      console.log('Error:', error.message);
    }
    
    console.log('\n🏁 DIAGNOSTIC COMPLETE');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    process.exit(0);
  }
}

diagnosticEmail();
