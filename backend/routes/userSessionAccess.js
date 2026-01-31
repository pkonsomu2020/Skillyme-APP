const express = require('express');
const { authenticateAdminToken } = require('../middleware/auth');
const db = require('../database/connection');

const router = express.Router();

// Get all users and their session access status for a specific session
router.get('/session/:sessionId/users', authenticateAdminToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.country,
        u.county,
        u.field_of_study,
        usa.access_granted,
        usa.admin_notes,
        usa.granted_at,
        usa.granted_by
      FROM users u
      LEFT JOIN user_session_access usa ON u.id = usa.user_id AND usa.session_id = $1
      ORDER BY u.name ASC
    `;
    
    const result = await db.query(query, [sessionId]);
    
    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching users for session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for session',
      error: error.message
    });
  }
});

// Grant or revoke access for a user to a specific session
router.post('/grant-access', authenticateAdminToken, async (req, res) => {
  try {
    const { userId, sessionId, accessGranted, adminNotes } = req.body;
    const adminId = req.admin.id;
    
    if (!userId || !sessionId || typeof accessGranted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'userId, sessionId, and accessGranted are required'
      });
    }
    
    // Check if record exists
    const existingQuery = `
      SELECT id FROM user_session_access 
      WHERE user_id = $1 AND session_id = $2
    `;
    const existingResult = await db.query(existingQuery, [userId, sessionId]);
    
    if (existingResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE user_session_access 
        SET access_granted = $1, admin_notes = $2, granted_by = $3, granted_at = NOW(), updated_at = NOW()
        WHERE user_id = $4 AND session_id = $5
        RETURNING *
      `;
      const result = await db.query(updateQuery, [accessGranted, adminNotes, adminId, userId, sessionId]);
      
      res.json({
        success: true,
        message: `Access ${accessGranted ? 'granted' : 'revoked'} successfully`,
        data: result.rows[0]
      });
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO user_session_access (user_id, session_id, access_granted, admin_notes, granted_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await db.query(insertQuery, [userId, sessionId, accessGranted, adminNotes, adminId]);
      
      res.json({
        success: true,
        message: `Access ${accessGranted ? 'granted' : 'revoked'} successfully`,
        data: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Error managing session access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage session access',
      error: error.message
    });
  }
});

// Get user's session access status (for frontend to check if join button should be enabled)
router.get('/user/:userId/session/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    const query = `
      SELECT access_granted, granted_at, admin_notes
      FROM user_session_access 
      WHERE user_id = $1 AND session_id = $2
    `;
    const result = await db.query(query, [userId, sessionId]);
    
    const hasAccess = result.rows.length > 0 ? result.rows[0].access_granted : false;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        accessDetails: result.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Error checking session access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session access',
      error: error.message
    });
  }
});

module.exports = router;