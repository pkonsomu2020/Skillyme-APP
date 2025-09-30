const pool = require('../config/database');

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
      await pool.execute(
        'INSERT INTO secure_access (user_id, session_id, access_token, created_at, expires_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [userId, sessionId, token]
      );
      
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
      const [rows] = await pool.execute(`
        SELECT sa.*, u.email, u.name, s.title as session_title, s.google_meet_link
        FROM secure_access sa
        JOIN users u ON sa.user_id = u.id
        JOIN sessions s ON sa.session_id = s.id
        WHERE sa.access_token = ? AND u.email = ? AND sa.expires_at > NOW()
      `, [token, userEmail]);
      
      if (rows.length === 0) {
        return { valid: false, message: 'Invalid or expired access token' };
      }
      
      return {
        valid: true,
        user: rows[0],
        session: {
          title: rows[0].session_title,
          google_meet_link: rows[0].google_meet_link
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
      const [rows] = await pool.execute(
        'SELECT access_token FROM secure_access WHERE user_id = ? AND session_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [userId, sessionId]
      );
      
      return rows.length > 0 ? rows[0].access_token : null;
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
      const [rows] = await pool.execute(`
        SELECT sa.*, u.name, u.email, sa.created_at as access_granted_at
        FROM secure_access sa
        JOIN users u ON sa.user_id = u.id
        WHERE sa.session_id = ? AND sa.expires_at > NOW()
        ORDER BY sa.created_at DESC
      `, [sessionId]);
      
      return rows;
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
      await pool.execute(
        'UPDATE secure_access SET expires_at = NOW() WHERE user_id = ? AND session_id = ?',
        [userId, sessionId]
      );
      
      console.log(`Access revoked for user ${userId}, session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }
}

module.exports = SecureAccess;
