const Session = require('../models/Session');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Get all available sessions (public endpoint)
const getAllSessions = async (req, res) => {
  try {
    // Fetching sessions
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        description,
        date,
        time,
        google_meet_link,
        recruiter,
        company,
        price,
        paybill_number,
        business_number,
        is_active,
        target_group,
        skill_area,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      throw error;
    }

    // Sessions retrieved successfully
    
    // Add default values for new fields if they don't exist
    const sessionsWithDefaults = sessions.map(session => ({
      ...session,
      target_group: session.target_group || 'all',
      skill_area: session.skill_area || 'general'
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithDefaults
      }
    });

  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
};

// Get user's enrolled sessions (protected endpoint)
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's enrolled sessions from payments table
    const { data: userSessions, error } = await supabase
      .from('payments')
      .select(`
        session_id,
        sessions (
          id,
          title,
          description,
          date,
          time,
          google_meet_link,
          recruiter,
          company,
          target_group,
          skill_area
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (error) {
      throw error;
    }

    const sessions = userSessions.map(payment => payment.sessions).filter(Boolean);

    res.json({
      success: true,
      data: {
        sessions
      }
    });

  } catch (error) {
    console.error('User sessions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions'
    });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await Session.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session'
    });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  getUserSessions
};
