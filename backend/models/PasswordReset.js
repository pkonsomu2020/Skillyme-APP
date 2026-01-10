const supabase = require('../config/supabase');
const crypto = require('crypto');

class PasswordReset {
  static async create(userId, token, expiresAt) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Creating reset token for user:', userId);
      console.log('🔍 [PASSWORD RESET DEBUG] Token:', token);
      console.log('🔍 [PASSWORD RESET DEBUG] Expires at:', expiresAt);
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ [PASSWORD RESET DEBUG] Supabase client is undefined');
        throw new Error('Database connection not available');
      }
      
      const { data, error } = await supabase
        .from('password_resets')
        .insert([{
          user_id: userId,
          token: token,
          expires_at: expiresAt
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Error creating password reset:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Password reset created successfully:', data);
      return { id: data.id, userId, token, expiresAt };
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Token creation failed:', error);
      throw error;
    }
  }

  static async findByToken(token) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Finding token:', token);
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ [PASSWORD RESET DEBUG] Supabase client is undefined');
        throw new Error('Database connection not available');
      }
      
      const { data: rows, error } = await supabase
        .from('password_resets')
        .select(`
          *,
          users!inner(email, name)
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [PASSWORD RESET DEBUG] Error finding token:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Token found:', rows ? 'Yes' : 'No');
      return rows || null;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error finding password reset:', error);
      throw error;
    }
  }

  static async deleteByToken(token) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Deleting token:', token);
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ [PASSWORD RESET DEBUG] Supabase client is undefined');
        throw new Error('Database connection not available');
      }
      
      const { data, error } = await supabase
        .from('password_resets')
        .delete()
        .eq('token', token)
        .select();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Error deleting token:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Token deleted successfully');
      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error deleting password reset:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Deleting all tokens for user:', userId);
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ [PASSWORD RESET DEBUG] Supabase client is undefined');
        throw new Error('Database connection not available');
      }
      
      const { data, error } = await supabase
        .from('password_resets')
        .delete()
        .eq('user_id', userId)
        .select();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Error deleting password resets for user:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] All tokens deleted for user:', userId);
      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error deleting password resets for user:', error);
      throw error;
    }
  }

  static async cleanupExpired() {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Cleaning up expired tokens');
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ [PASSWORD RESET DEBUG] Supabase client is undefined');
        throw new Error('Database connection not available');
      }
      
      const { data, error } = await supabase
        .from('password_resets')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Error cleaning up expired tokens:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Cleaned up expired tokens:', data ? data.length : 0);
      return data ? data.length : 0;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error cleaning up expired password resets:', error);
      throw error;
    }
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static getExpirationTime() {
    // Token expires in 1 hour
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);
    return expirationTime;
  }
}

module.exports = PasswordReset;
