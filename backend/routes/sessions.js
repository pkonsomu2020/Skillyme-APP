const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllSessions, getSessionById, getUserSessions } = require('../controllers/sessionController');
const UserPoints = require('../models/UserPoints');
const supabaseAdmin = require('../config/supabaseAdmin');

// Get all sessions (public endpoint)
router.get('/', getAllSessions);

// Get session by ID (public endpoint)
router.get('/:id', getSessionById);

// Get user's enrolled sessions (protected endpoint)
router.get('/user/enrolled', authenticateToken, getUserSessions);

// Join session and award points (protected endpoint)
router.post('/:sessionId/join', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Check if user has access to this session
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('user_session_access')
      .select('access_granted')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();
    
    if (accessError && accessError.code !== 'PGRST116') {
      throw accessError;
    }
    
    if (!accessData || !accessData.access_granted) {
      return res.status(403).json({
        success: false,
        message: 'Access not granted for this session'
      });
    }
    
    // Check if user has already joined this session (to prevent duplicate points)
    const { data: existingJoin, error: joinCheckError } = await supabaseAdmin
      .from('session_joins')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();
    
    if (joinCheckError && joinCheckError.code !== 'PGRST116') {
      console.warn('Error checking existing join:', joinCheckError);
    }
    
    let pointsAwarded = 0;
    let isFirstJoin = !existingJoin;
    
    if (isFirstJoin) {
      // Award points for joining session (first time only)
      const sessionJoinPoints = 10; // Points for joining a session
      
      try {
        await UserPoints.addPoints(userId, sessionJoinPoints, 'session_join', {
          session_id: sessionId,
          reason: 'Joined career session'
        });
        pointsAwarded = sessionJoinPoints;
        
        // Record the session join
        const { error: insertError } = await supabaseAdmin
          .from('session_joins')
          .insert({
            user_id: userId,
            session_id: sessionId,
            joined_at: new Date().toISOString(),
            points_awarded: sessionJoinPoints
          });
        
        if (insertError) {
          console.error('Error recording session join:', insertError);
        }
        
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Continue even if points fail - don't block session access
      }
    }
    
    // Get session details for response
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('title, google_meet_link')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      throw sessionError;
    }
    
    res.json({
      success: true,
      message: isFirstJoin 
        ? `Successfully joined session! You earned ${pointsAwarded} points.`
        : 'Welcome back to the session!',
      data: {
        sessionId: parseInt(sessionId),
        sessionTitle: sessionData.title,
        googleMeetLink: sessionData.google_meet_link,
        pointsAwarded,
        isFirstJoin
      }
    });
    
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join session',
      error: error.message
    });
  }
});

module.exports = router;
