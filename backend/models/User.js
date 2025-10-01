const pool = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password, phone, country, county, field_of_study, institution, level_of_study } = userData;
    const query = `
      INSERT INTO users (name, email, password, phone, country, county, field_of_study, institution, level_of_study, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;
    const values = [name, email, password, phone, country, county, field_of_study, institution, level_of_study];
    
    try {
      const result = await pool.query(query, values);
      return { id: result.rows[0].id, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    const query = `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $${values.length}`;
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
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
    const query = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2';
    
    try {
      const result = await pool.query(query, [hashedPassword, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

module.exports = User;