const supabase = require('../config/supabase');

/**
 * Secure Access Model
 * Handles user-specific session access and verification
 */
class SecureAccess {
  /**
   * Generate unique access token for user
   */
  static async generateAccessToken(userId, sessionId) {
    try {
      // Generate unique token
      const token = `skillyme_${userId}_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      const { error } = await supabase
        .from('secure_access')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          access_token: token,
          expires_at: expiresAt.toISOString()
        }]);
      
      if (error) throw error;
      
      return token;
    } catch (error) {
      console.error('Error generating access token:', error);
      throw error;
    }
  }
  
  /**
   * Verify access token for user
   */
  static async verifyAccessToken(token, userEmail) {
    try {
      const { data: rows, error } = await supabase
        .from('secure_access')
        .select(`
          *,
          users!inner(email, name),
          sessions!inner(title, google_meet_link)
        `)
        .eq('access_token', token)
        .eq('users.email', userEmail)
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      
      if (!rows || rows.length === 0) {
        return { valid: false, message: 'Invalid or expired access token' };
      }
      
      const row = rows[0];
      return {
        valid: true,
        user: row,
        session: {
          title: row.sessions?.title,
          google_meet_link: row.sessions?.google_meet_link
        }
      };
    } catch (error) {
      console.error('Error verifying access token:', error);
      return { valid: false, message: 'Access verification failed' };
    }
  }
  
  /**
   * Get user's access token for session
   */
  static async getUserAccessToken(userId, sessionId) {
    try {
      const { data: rows, error } = await supabase
        .from('secure_access')
        .select('access_token')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      return rows && rows.length > 0 ? rows[0].access_token : null;
    } catch (error) {
      console.error('Error getting user access token:', error);
      return null;
    }
  }
  
  /**
   * Create secure access for paid user
   */
  static async createSecureAccess(userId, sessionId) {
    try {
      // Check if user already has access
      const existingToken = await this.getUserAccessToken(userId, sessionId);
      if (existingToken) {
        return existingToken;
      }
      
      // Generate new access token
      const token = await this.generateAccessToken(userId, sessionId);
      
      console.log(`Secure access created for user ${userId}, session ${sessionId}`);
      return token;
    } catch (error) {
      console.error('Error creating secure access:', error);
      throw error;
    }
  }
  
  /**
   * Get all users with access to session
   */
  static async getSessionAccessList(sessionId) {
    try {
      const { data: rows, error } = await supabase
        .from('secure_access')
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return rows || [];
    } catch (error) {
      console.error('Error getting session access list:', error);
      return [];
    }
  }
  
  /**
   * Revoke access for user
   */
  static async revokeAccess(userId, sessionId) {
    try {
      const { error } = await supabase
        .from('secure_access')
        .update({ expires_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      console.log(`Access revoked for user ${userId}, session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }
}

module.exports = SecureAccess;
