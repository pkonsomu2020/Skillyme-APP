const supabase = require('../config/supabase');

// Get dashboard statistics for a user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetching dashboard stats

    // Get available sessions count
    const { count: availableSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (sessionsError) throw sessionsError;
    // Available sessions retrieved

    // Get sessions joined by user (from payments table)
    const { count: sessionsJoined, error: joinedError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'paid');
    
    if (joinedError) throw joinedError;
    // Sessions joined retrieved

    // Get session cost (from sessions table)
    const { data: costResult, error: costError } = await supabase
      .from('sessions')
      .select('price')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (costError && costError.code !== 'PGRST116') throw costError;
    const sessionCost = costResult?.price || 200;
    // Session cost retrieved

    // Get recruiters count (from sessions table)
    const { data: recruitersResult, error: recruitersError } = await supabase
      .from('sessions')
      .select('recruiter')
      .eq('is_active', true);
    
    if (recruitersError) throw recruitersError;
    const recruiters = new Set(recruitersResult.map(r => r.recruiter)).size;
    // Recruiters count retrieved

    res.json({
      success: true,
      data: {
        availableSessions,
        sessionsJoined,
        sessionCost,
        recruiters
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
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
    console.error('User sessions error:', error);
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
