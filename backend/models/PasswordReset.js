const { supabaseServiceRole } = require('../config/supabase');
const crypto = require('crypto');

class PasswordReset {
  static async create(userId, token, expiresAt) {
    try {
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .insert([{
          user_id: userId,
          token: token,
          expires_at: expiresAt
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return { id: data.id, userId, token, expiresAt };
    } catch (error) {
      console.error('Error creating password reset:', error);
      throw error;
    }
  }

  static async findByToken(token) {
    try {
      // Use service role to bypass RLS for password resets
      const { data: rows, error } = await supabaseServiceRole
        .from('password_resets')
        .select(`
          *,
          users!inner(email, name)
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return rows || null;
    } catch (error) {
      console.error('Error finding password reset:', error);
      throw error;
    }
  }

  static async deleteByToken(token) {
    try {
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .delete()
        .eq('token', token)
        .select();
      
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error deleting password reset:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId) {
    try {
      // Use service role to bypass RLS for password resets
      const { data, error } = await supabaseServiceRole
        .from('password_resets')
        .delete()
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error deleting password resets for user:', error);
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
