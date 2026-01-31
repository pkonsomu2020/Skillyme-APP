const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// Get user's access status for all sessions
router.get('/my-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's session access records
    const { data: accessData, error: accessError } = await supabase
      .from('user_session_access')
      .select(`
        session_id,
        access_granted,
        granted_at,
        sessions (
          title
        )
      `)
      .eq('user_id', userId)
      .eq('access_granted', true);
    
    if (accessError) {
      throw accessError;
    }
    
    // Transform the data to match expected format
    const accessibleSessions = accessData.map(access => ({
      session_id: access.session_id,
      access_granted: access.access_granted,
      granted_at: access.granted_at,
      session_title: access.sessions?.title || 'Unknown Session'
    }));
    
    res.json({
      success: true,
      data: {
        accessibleSessions
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
    
    const { data, error } = await supabase
      .from('user_session_access')
      .select('access_granted, granted_at, admin_notes')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    const hasAccess = data ? data.access_granted : false;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        accessDetails: data || null
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