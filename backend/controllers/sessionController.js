const Session = require('../models/Session');
const supabase = require('../config/supabase');

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
    
    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
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
  getSessionById
};
