const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/connection');

const router = express.Router();

// Get user's access status for all sessions
router.get('/my-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        usa.session_id,
        usa.access_granted,
        usa.granted_at,
        s.title as session_title
      FROM user_session_access usa
      JOIN sessions s ON usa.session_id = s.id
      WHERE usa.user_id = $1 AND usa.access_granted = true
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: {
        accessibleSessions: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching user session access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session access',
      error: error.message
    });
  }
});

// Check access for a specific session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
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