const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

/**
 * Password hash integrity checker
 * Ensures all password hashes are valid and secure
 */
class HashIntegrityChecker {
  static async checkAllHashes() {
    try {
      console.log('🔍 Checking password hash integrity...');
      
      // Get all users from Supabase
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, password');
      
      if (error) {
        throw error;
      }
      
      const results = {
        total: users.length,
        valid: 0,
        invalid: 0,
        corrupted: 0,
        issues: []
      };
      
      for (const user of users) {
        const hashCheck = await this.validateHash(user.password);
        
        if (hashCheck.isValid) {
          results.valid++;
        } else {
          results.invalid++;
          results.issues.push({
            userId: user.id,
            email: user.email,
            issue: hashCheck.issue,
            severity: hashCheck.severity
          });
          
          if (hashCheck.severity === 'CRITICAL') {
            results.corrupted++;
          }
        }
      }
      
      console.log(`✅ Hash integrity check complete:`);
      console.log(`   Total users: ${results.total}`);
      console.log(`   Valid hashes: ${results.valid}`);
      console.log(`   Invalid hashes: ${results.invalid}`);
      console.log(`   Corrupted hashes: ${results.corrupted}`);
      
      if (results.issues.length > 0) {
        console.log('\n⚠️  Issues found:');
        results.issues.forEach(issue => {
          console.log(`   ${issue.severity}: User ${issue.userId} (${issue.email}) - ${issue.issue}`);
        });
      }
      
      return results;
    } catch (error) {
      console.error('❌ Hash integrity check failed:', error.message);
      throw error;
    }
  }
  
  static async validateHash(hash) {
    try {
      // Check if hash exists
      if (!hash || hash.trim() === '') {
        return {
          isValid: false,
          issue: 'Empty password hash',
          severity: 'CRITICAL'
        };
      }
      
      // Check hash format
      if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
        return {
          isValid: false,
          issue: 'Invalid hash format',
          severity: 'CRITICAL'
        };
      }
      
      // Check hash length (bcrypt hashes should be 60 characters)
      if (hash.length !== 60) {
        return {
          isValid: false,
          issue: 'Invalid hash length',
          severity: 'CRITICAL'
        };
      }
      
      // Test hash with a dummy password to ensure it's not corrupted
      try {
        await bcrypt.compare('dummy', hash);
        return { isValid: true };
      } catch (error) {
        return {
          isValid: false,
          issue: 'Corrupted hash - cannot process',
          severity: 'CRITICAL'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        issue: `Hash validation error: ${error.message}`,
        severity: 'CRITICAL'
      };
    }
  }
  
  static async fixCorruptedHashes() {
    try {
      console.log('🔧 Fixing corrupted password hashes...');
      
      // Get users with corrupted hashes
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, password');
      
      if (error) {
        throw error;
      }
      
      const corruptedUsers = [];
      
      for (const user of users) {
        const hashCheck = await this.validateHash(user.password);
        if (!hashCheck.isValid && hashCheck.severity === 'CRITICAL') {
          corruptedUsers.push(user);
        }
      }
      
      if (corruptedUsers.length === 0) {
        console.log('✅ No corrupted hashes found');
        return;
      }
      
      console.log(`Found ${corruptedUsers.length} corrupted hashes`);
      
      // Reset passwords for corrupted users
      for (const user of corruptedUsers) {
        const defaultPassword = 'password123';
        const saltRounds = 12;
        const newHash = await bcrypt.hash(defaultPassword, saltRounds);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            password: newHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`✅ Reset password for user ${user.email}`);
      }
      
      console.log('✅ All corrupted hashes fixed');
      
    } catch (error) {
      console.error('❌ Failed to fix corrupted hashes:', error.message);
      throw error;
    }
  }
  
  static async scheduleIntegrityCheck() {
    // Run integrity check every 24 hours
    setInterval(async () => {
      try {
        await this.checkAllHashes();
      } catch (error) {
        console.error('Scheduled integrity check failed:', error.message);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}

module.exports = HashIntegrityChecker;
