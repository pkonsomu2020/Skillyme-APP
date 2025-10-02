const pool = require('../config/database');

class Session {
  static async findById(id) {
    const query = 'SELECT * FROM sessions WHERE id = ?';
    try {
      const result = await pool.execute(query, [id]);
      const rows = result[0];
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  static async getAllSessions() {
    const query = `
      SELECT 
        id, title, description, date, time, google_meet_link,
        recruiter, company, price, is_active, paybill_number, business_number,
        created_at, updated_at
      FROM sessions 
      ORDER BY created_at DESC
    `;
    try {
      const result = await pool.execute(query);
      const rows = result[0];
      return rows;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  static async create(sessionData) {
    const { 
      title, description, date, time, duration, google_meet_link, 
      recruiter_name, recruiter_email, paybill_number, business_number, price 
    } = sessionData;
    const query = `
      INSERT INTO sessions (
        title, description, date, time, duration, google_meet_link, 
        recruiter_name, recruiter_email, paybill_number, business_number, price, created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      title, description, date, time, duration, google_meet_link, 
      recruiter_name, recruiter_email, paybill_number, business_number, price
    ];
    
    try {
      const result = await pool.execute(query, values);
      return { id: result[0].insertId, ...sessionData };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    const query = `UPDATE sessions SET ${fields}, updated_at = NOW() WHERE id = ?`;
    
    try {
      const result = await pool.execute(query, values);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }
}

module.exports = Session;
