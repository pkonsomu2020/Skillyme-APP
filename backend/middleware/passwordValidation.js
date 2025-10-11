const bcrypt = require('bcryptjs');

/**
 * Password validation middleware
 * Ensures passwords meet security requirements
 */
class PasswordValidator {
  static validatePassword(password) {
    const errors = [];
    
    // Length check
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    // Character requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Common password check
    const commonPasswords = [
      'password', 'password123', '123456', 'admin', 'test', 'user',
      'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon',
      'master', 'hello', 'login', 'pass', '123456789', 'password1'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more secure password');
    }
    
    // Sequential character check
    if (this.hasSequentialChars(password)) {
      errors.push('Password contains sequential characters (e.g., 123, abc)');
    }
    
    // Repeated character check
    if (this.hasRepeatedChars(password)) {
      errors.push('Password contains too many repeated characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static hasSequentialChars(password) {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
                      'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs',
                      'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
    
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }
  
  static hasRepeatedChars(password) {
    const repeated = /(.)\1{2,}/;
    return repeated.test(password);
  }
  
  static async hashPassword(password) {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Verify the hash immediately
      const isValid = await bcrypt.compare(password, hashedPassword);
      if (!isValid) {
        throw new Error('Password hashing verification failed');
      }
      
      return hashedPassword;
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password securely');
    }
  }
  
  static async verifyPassword(hashedPassword, plainPassword) {
    try {
      if (!hashedPassword || !plainPassword) {
        return false;
      }
      
      // Check if hash format is valid
      if (!hashedPassword.startsWith('$2a') && !hashedPassword.startsWith('$2b')) {
        console.error('Invalid password hash format');
        return false;
      }
      
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

module.exports = PasswordValidator;