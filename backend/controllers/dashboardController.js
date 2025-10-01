const pool = require('../config/database');

// Get dashboard statistics for a user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get available sessions count
    const [sessionsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM sessions WHERE is_active = 1'
    );
    const availableSessions = sessionsResult[0].count;

    // Get sessions joined by user
    const [joinedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?',
      [userId]
    );
    const sessionsJoined = joinedResult[0].count;

    // Get session cost (from sessions table)
    const [costResult] = await pool.execute(
      'SELECT price FROM sessions WHERE is_active = 1 LIMIT 1'
    );
    const sessionCost = costResult[0]?.price || 200;

    // Get recruiters count (this could be from a recruiters table or sessions)
    const [recruitersResult] = await pool.execute(
      'SELECT COUNT(DISTINCT recruiter) as count FROM sessions WHERE is_active = 1'
    );
    const recruiters = recruitersResult[0].count;

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

    const [sessions] = await pool.execute(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.date,
        s.time,
        s.price,
        s.status as session_status,
        us.status as user_status,
        us.created_at as joined_at
      FROM sessions s
      LEFT JOIN user_sessions us ON s.id = us.session_id AND us.user_id = ?
      WHERE s.status = 'active'
      ORDER BY s.date ASC
    `, [userId]);

    res.json({
      success: true,
      data: sessions
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
