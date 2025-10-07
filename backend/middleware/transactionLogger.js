const fs = require('fs').promises;
const path = require('path');

/**
 * Database transaction logging middleware
 * Tracks all database operations for audit and debugging
 */
class TransactionLogger {
  static async logTransaction(operation, table, data, userId = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      table,
      userId,
      data: this.sanitizeData(data),
      requestId: this.generateRequestId()
    };
    
    try {
      const logsDir = path.join(__dirname, '../logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, `transactions-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log transaction:', error.message);
    }
  }
  
  static sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  static generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  static async logUserRegistration(userData, userId) {
    await this.logTransaction('CREATE', 'users', userData, userId);
  }
  
  static async logUserLogin(email, userId, success) {
    await this.logTransaction(
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', 
      'users', 
      { email, success }, 
      userId
    );
  }
  
  static async logPasswordChange(userId, success) {
    await this.logTransaction(
      success ? 'PASSWORD_CHANGE_SUCCESS' : 'PASSWORD_CHANGE_FAILED',
      'users',
      { success },
      userId
    );
  }
  
  static async logPaymentSubmission(paymentData, userId) {
    await this.logTransaction('PAYMENT_SUBMIT', 'payments', paymentData, userId);
  }
  
  static async logAdminAction(action, adminId, targetUserId = null) {
    await this.logTransaction('ADMIN_ACTION', 'admin_logs', { action, targetUserId }, adminId);
  }

  static async logAdminLogin(email, adminId, success) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation: 'admin_login',
      email,
      adminId,
      success,
      requestId: this.generateRequestId()
    };
    
    try {
      const logsDir = path.join(__dirname, '../logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, `transactions-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log admin login:', error.message);
    }
  }
}

module.exports = TransactionLogger;
