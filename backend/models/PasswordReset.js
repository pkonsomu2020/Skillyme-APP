const { supabaseServiceRole } = require('../config/supabase');
const crypto = require('crypto');

class PasswordReset {
  static async create(userId, token, expiresAt) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Creating reset token for user:', userId);
      console.log('🔍 [PASSWORD RESET DEBUG] Token:', token);
      console.log('🔍 [PASSWORD RESET DEBUG] Expires at:', expiresAt);
      
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .insert([{
          user_id: userId,
          token: token,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Insert error:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Created reset record:', data);
      return { id: data.id, userId, token, expiresAt };
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error creating password reset:', error);
      throw error;
    }
  }

  static async findByToken(token) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Looking for token:', token);
      
      // First, get the password reset record
      const { data: resetData, error: resetError } = await supabaseServiceRole
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (resetError) {
        console.error('❌ [PASSWORD RESET DEBUG] Reset lookup error:', resetError);
        if (resetError.code === 'PGRST116') {
          console.log('🔍 [PASSWORD RESET DEBUG] Token not found or expired');
          return null;
        }
        throw resetError;
      }
      
      if (!resetData) {
        console.log('🔍 [PASSWORD RESET DEBUG] No reset data found');
        return null;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Found reset record:', resetData);
      
      // Then get the user data separately
      const { data: userData, error: userError } = await supabaseServiceRole
        .from('users')
        .select('email, name')
        .eq('id', resetData.user_id)
        .single();
      
      if (userError) {
        console.error('❌ [PASSWORD RESET DEBUG] User lookup error:', userError);
        throw userError;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Found user data:', userData);
      
      // Combine the data
      const result = {
        ...resetData,
        email: userData.email,
        name: userData.name
      };
      
      console.log('✅ [PASSWORD RESET DEBUG] Returning combined result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error finding password reset:', error);
      throw error;
    }
  }

  static async deleteByToken(token) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Deleting token:', token);
      
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .delete()
        .eq('token', token)
        .select();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Delete error:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Deleted records:', data);
      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error deleting password reset:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId) {
    try {
      console.log('🔍 [PASSWORD RESET DEBUG] Deleting all tokens for user:', userId);
      
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .delete()
        .eq('user_id', userId)
        .select();
      
      if (error) {
        console.error('❌ [PASSWORD RESET DEBUG] Delete by user error:', error);
        throw error;
      }
      
      console.log('✅ [PASSWORD RESET DEBUG] Deleted user tokens:', data);
      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [PASSWORD RESET DEBUG] Error deleting password resets for user:', error);
      throw error;
    }
  }

  static async cleanupExpired() {
    try {
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();
      
      if (error) throw error;
      
      return data ? data.length : 0;
    } catch (error) {
      console.error('Error cleaning up expired password resets:', error);
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
