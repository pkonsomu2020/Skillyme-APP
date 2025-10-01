const pool = require('../config/database');

class Payment {
  static async create(paymentData) {
    const { 
      userId, 
      sessionId, 
      mpesaCode, 
      amount, 
      expectedAmount, 
      actualAmount, 
      amountMismatch, 
      fullMpesaMessage,
      status = 'pending' 
    } = paymentData;
    
    const query = `
      INSERT INTO payments (
        user_id, session_id, mpesa_code, amount, 
        expected_amount, actual_amount, amount_mismatch, 
        full_mpesa_message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userId, sessionId, mpesaCode, amount,
      expectedAmount, actualAmount, amountMismatch,
      fullMpesaMessage, status
    ];
    
    try {
      const result = await pool.execute(query, values);
      return { id: result[0].insertId, ...paymentData };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  static async getAllPayments() {
    // First, let's check the table structure to handle schema differences
    let query;
    try {
      // Try the standard query first
      query = `
        SELECT 
          p.id as payment_id,
          p.user_id,
          p.session_id,
          p.mpesa_code,
          p.amount,
          p.actual_amount,
          p.amount_mismatch,
          p.status,
          p.full_mpesa_message,
          p.created_at AS submission_date,
          u.name AS user_name,
          u.email AS user_email,
          s.title AS session_title,
          s.google_meet_link AS session_google_meet_link
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN sessions s ON p.session_id = s.id
        ORDER BY p.created_at DESC
      `;
      
      const result = await pool.execute(query);
      const rows = result[0];
      console.log(`Found ${rows.length} payments`);
      return rows;
    } catch (error) {
      console.error('Error with standard query, trying fallback:', error.message);
      
      // Fallback query without the problematic column
      try {
        query = `
          SELECT 
            p.payment_id,
            p.user_id,
            p.session_id,
            p.mpesa_code,
            p.amount,
            p.actual_amount,
            p.amount_mismatch,
            p.status,
            p.created_at AS submission_date,
            u.name AS user_name,
            u.email AS user_email,
            s.title AS session_title,
            s.google_meet_link AS session_google_meet_link
          FROM payments p
          JOIN users u ON p.user_id = u.id
          LEFT JOIN sessions s ON p.session_id = s.id
          ORDER BY p.created_at DESC
        `;
        
        const result = await pool.execute(query);
        const rows = result[0];
        console.log(`Found ${rows.length} payments (fallback query)`);
        return rows;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        
        // Last resort - simple query
        query = `
          SELECT 
            p.*,
            u.name AS user_name,
            u.email AS user_email,
            s.title AS session_title,
            s.google_meet_link AS session_google_meet_link
          FROM payments p
          JOIN users u ON p.user_id = u.id
          LEFT JOIN sessions s ON p.session_id = s.id
          ORDER BY p.created_at DESC
        `;
        
        const result = await pool.execute(query);
        const rows = result[0];
        console.log(`Found ${rows.length} payments (simple query)`);
        return rows;
      }
    }
  }

  static async updateStatus(paymentId, status, adminNotes = null) {
    let query;
    try {
      // Try with 'id' column first
      query = `
        UPDATE payments 
        SET status = ?, admin_notes = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      
      const result = await pool.execute(query, [status, adminNotes, paymentId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error with id column, trying payment_id:', error.message);
      
      try {
        // Fallback to 'payment_id' column
        query = `
          UPDATE payments 
          SET status = ?, admin_notes = ?, updated_at = NOW() 
          WHERE payment_id = ?
        `;
        
        const result = await pool.execute(query, [status, adminNotes, paymentId]);
        return result[0].affectedRows > 0;
      } catch (fallbackError) {
        console.error('Error updating payment status:', fallbackError);
        throw fallbackError;
      }
    }
  }
}

module.exports = Payment;