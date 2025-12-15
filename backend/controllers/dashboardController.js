const supabase = require('../config/supabase');

// Get dashboard statistics for a user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetching dashboard stats

    // Get sessions joined by user (from payments table) - this becomes points earned
    const { count: sessionsJoined, error: joinedError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'paid');
    
    if (joinedError) throw joinedError;
    
    // Calculate points earned (10 points per session joined)
    const pointsEarned = (sessionsJoined || 0) * 10;

    // Assignments completed (for now, same as sessions joined)
    const assignmentsCompleted = sessionsJoined || 0;

    // Get upcoming sessions count (active sessions in the future)
    const { count: upcomingSessions, error: upcomingError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('date', new Date().toISOString().split('T')[0]);
    
    if (upcomingError) throw upcomingError;

    // Determine current level based on sessions joined
    let currentLevel = 'Beginner';
    if (sessionsJoined >= 10) {
      currentLevel = 'Pro';
    } else if (sessionsJoined >= 3) {
      currentLevel = 'Explorer';
    }

    res.json({
      success: true,
      data: {
        pointsEarned,
        assignmentsCompleted,
        upcomingSessions: upcomingSessions || 0,
        currentLevel
      }
    });

  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get user's recent sessions
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        description,
        date,
        time,
        price,
        is_active,
        payments!left(status, submitted_at)
      `)
      .eq('is_active', true)
      .eq('payments.user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;

    // Transform the data to match expected format
    const transformedSessions = sessions?.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      date: session.date,
      time: session.time,
      price: session.price,
      session_status: session.is_active,
      payment_status: session.payments?.[0]?.status || null,
      joined_at: session.payments?.[0]?.submitted_at || null
    })) || [];

    res.json({
      success: true,
      data: transformedSessions
    });

  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUserSessions
};
