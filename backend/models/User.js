const pool = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password, phone, country, county, field_of_study, institution, level_of_study } = userData;
    const query = `
      INSERT INTO users (name, email, password, phone, country, county, field_of_study, institution, level_of_study, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [name, email, password, phone, country, county, field_of_study, institution, level_of_study];
    
    try {
      const result = await pool.execute(query, values);
      return { id: result[0].insertId, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    try {
      const result = await pool.execute(query, [email]);
      return result[0][0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    try {
      const result = await pool.execute(query, [id]);
      return result[0][0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    const query = `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = ?`;
    
    try {
      const result = await pool.execute(query, values);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async verifyPassword(hashedPassword, plainPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
    
    try {
      const result = await pool.execute(query, [hashedPassword, userId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

module.exports = User;