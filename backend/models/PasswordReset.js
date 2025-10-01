const pool = require('../config/database');
const crypto = require('crypto');

class PasswordReset {
  static async create(userId, token, expiresAt) {
    const query = `
      INSERT INTO password_resets (user_id, token, expires_at) 
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    try {
      const result = await pool.query(query, [userId, token, expiresAt]);
      return { id: result.rows[0].id, userId, token, expiresAt };
    } catch (error) {
      console.error('Error creating password reset:', error);
      throw error;
    }
  }

  static async findByToken(token) {
    const query = `
      SELECT pr.*, u.email, u.name 
      FROM password_resets pr 
      JOIN users u ON pr.user_id = u.id 
      WHERE pr.token = $1 AND pr.expires_at > NOW()
    `;
    
    try {
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding password reset:', error);
      throw error;
    }
  }

  static async deleteByToken(token) {
    const query = 'DELETE FROM password_resets WHERE token = $1';
    
    try {
      const result = await pool.query(query, [token]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting password reset:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId) {
    const query = 'DELETE FROM password_resets WHERE user_id = $1';
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting password resets for user:', error);
      throw error;
    }
  }

  static async cleanupExpired() {
    const query = 'DELETE FROM password_resets WHERE expires_at < NOW()';
    
    try {
      const result = await pool.query(query);
      return result.rowCount;
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
