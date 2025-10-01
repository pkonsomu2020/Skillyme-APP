const pool = require('../config/database');

// Get dashboard statistics for a user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching dashboard stats for user:', userId);

    // Get available sessions count
    const [sessionsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM sessions WHERE is_active = 1'
    );
    const availableSessions = sessionsResult[0].count;
    console.log('Available sessions:', availableSessions);

    // Get sessions joined by user (from payments table)
    const [joinedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = "paid"',
      [userId]
    );
    const sessionsJoined = joinedResult[0].count;
    console.log('Sessions joined:', sessionsJoined);

    // Get session cost (from sessions table)
    const [costResult] = await pool.execute(
      'SELECT price FROM sessions WHERE is_active = 1 LIMIT 1'
    );
    const sessionCost = costResult[0]?.price || 200;
    console.log('Session cost:', sessionCost);

    // Get recruiters count (from sessions table)
    const [recruitersResult] = await pool.execute(
      'SELECT COUNT(DISTINCT recruiter) as count FROM sessions WHERE is_active = 1'
    );
    const recruiters = recruitersResult[0].count;
    console.log('Recruiters:', recruiters);

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
        s.is_active as session_status,
        p.status as payment_status,
        p.created_at as joined_at
      FROM sessions s
      LEFT JOIN payments p ON s.id = p.session_id AND p.user_id = ?
      WHERE s.is_active = 1
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
