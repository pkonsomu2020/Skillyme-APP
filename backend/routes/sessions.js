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
    
    // Get session details first (needed for discount creation)
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('title, google_meet_link')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      throw sessionError;
    }
    
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
    let discountCreated = false;
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
        
        // Create 5% discount for the user using existing table structure
        try {
          // Get current user points for the discount record
          const currentUserPoints = await UserPoints.getUserPoints(userId);
          
          // Generate unique discount code
          const discountCode = `SKILL${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          
          const { data: discountData, error: discountError } = await supabaseAdmin
            .from('user_discounts')
            .insert({
              user_id: userId,
              discount_percentage: 5,
              discount_type: 'session_join',
              status: 'active',
              awarded_by: 1, // System admin ID
              awarded_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              reason: `Session participation reward - Joined session: ${sessionData.title}`,
              user_points_at_award: currentUserPoints.total_points + sessionJoinPoints,
              discount_code: discountCode,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (discountError) {
            console.error('Error creating discount:', discountError);
          } else {
            discountCreated = true;
            console.log('Created 5% discount for user:', userId, 'with code:', discountCode);
          }
        } catch (discountCreationError) {
          console.error('Error in discount creation:', discountCreationError);
        }
        
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Continue even if points fail - don't block session access
      }
    }
    
    // Prepare success message
    let message = isFirstJoin 
      ? `Successfully joined session! You earned ${pointsAwarded} points.`
      : 'Welcome back to the session!';
    
    if (discountCreated) {
      message += ' 🎉 You also received a 5% discount for your next phase!';
    }
    
    res.json({
      success: true,
      message,
      data: {
        sessionId: parseInt(sessionId),
        sessionTitle: sessionData.title,
        googleMeetLink: sessionData.google_meet_link,
        pointsAwarded,
        isFirstJoin,
        discountCreated,
        discountPercentage: discountCreated ? 5 : 0
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
