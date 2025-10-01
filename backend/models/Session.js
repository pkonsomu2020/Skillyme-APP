const pool = require('../config/database');

class Session {
  static async findById(id) {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      const rows = result.rows;
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  static async getAllSessions() {
    const query = 'SELECT * FROM sessions ORDER BY created_at DESC';
    try {
      const result = await pool.query(query);
      const rows = result.rows;
      return rows;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  static async create(sessionData) {
    const { title, description, date, time, duration, google_meet_link, recruiter_name, recruiter_email } = sessionData;
    const query = `
      INSERT INTO sessions (title, description, date, time, duration, google_meet_link, recruiter_name, recruiter_email, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;
    const values = [title, description, date, time, duration, google_meet_link, recruiter_name, recruiter_email];
    
    try {
      const result = await pool.query(query, values);
      return { id: result.rows[0].id, ...sessionData };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    const query = `UPDATE sessions SET ${fields}, updated_at = NOW() WHERE id = $${values.length}`;
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }
}

module.exports = Session;
