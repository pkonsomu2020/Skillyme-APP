const fs = require('fs').promises;
const path = require('path');

/**
 * Comprehensive error handling and logging middleware
 */
class ErrorHandler {
  static async logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      severity: this.getSeverity(error)
    };
    
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.join(__dirname, '../logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      // Write to daily log file
      const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[${timestamp}] ${logEntry.severity}: ${error.message}`);
        if (context.userId) console.error(`User ID: ${context.userId}`);
        if (context.email) console.error(`Email: ${context.email}`);
      }
    } catch (logError) {
      console.error('Failed to write error log:', logError.message);
    }
  }
  
  static getSeverity(error) {
    if (error.name === 'ValidationError') return 'WARNING';
    if (error.name === 'UnauthorizedError') return 'WARNING';
    if (error.name === 'DatabaseError') return 'ERROR';
    if (error.name === 'PasswordError') return 'ERROR';
    if (error.message.includes('password')) return 'ERROR';
    if (error.message.includes('authentication')) return 'ERROR';
    return 'INFO';
  }
  
  static handleAuthError(error, res) {
    const timestamp = new Date().toISOString();
    
    // Log the error
    this.logError(error, {
      endpoint: res.req?.originalUrl,
      method: res.req?.method,
      ip: res.req?.ip,
      userAgent: res.req?.get('User-Agent')
    });
    
    // Don't expose sensitive information
    const safeMessage = this.getSafeErrorMessage(error);
    
    return res.status(this.getStatusCode(error)).json({
      success: false,
      message: safeMessage,
      timestamp,
      requestId: this.generateRequestId()
    });
  }
  
  static getSafeErrorMessage(error) {
    // Never expose internal errors to client
    if (error.message.includes('password')) {
      return 'Authentication failed. Please check your credentials.';
    }
    
    if (error.message.includes('database') || error.message.includes('connection')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    if (error.message.includes('validation')) {
      return 'Invalid input provided. Please check your data.';
    }
    
    return 'An error occurred. Please try again.';
  }
  
  static getStatusCode(error) {
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'UnauthorizedError') return 401;
    if (error.name === 'DatabaseError') return 503;
    if (error.message.includes('password')) return 401;
    return 500;
  }
  
  static generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  static async validateDatabaseConnection() {
    try {
      const pool = require('../config/database');
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      await this.logError(error, { context: 'database_health_check' });
      return false;
    }
  }
}

module.exports = ErrorHandler;
