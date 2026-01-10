const supabase = require('../config/supabase');

// Get dashboard statistics for authenticated user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's payment statistics
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, status, session_id')
      .eq('user_id', userId);

    if (paymentsError) {
      throw paymentsError;
    }

    // Get user's assignment submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('points_earned, status')
      .eq('user_id', userId);

    if (submissionsError) {
      throw submissionsError;
    }

    // Get upcoming sessions user is enrolled in
    const completedPayments = payments.filter(p => p.status === 'completed');
    const sessionIds = completedPayments.map(p => p.session_id);
    
    let upcomingSessions = 0;
    if (sessionIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, date')
        .in('id', sessionIds)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (!sessionsError) {
        upcomingSessions = sessions.length;
      }
    }

    // Calculate statistics
    const stats = {
      pointsEarned: submissions.reduce((total, sub) => total + (sub.points_earned || 0), 0),
      assignmentsCompleted: submissions.filter(sub => sub.status === 'completed').length,
      upcomingSessions: upcomingSessions,
      totalSpent: completedPayments.reduce((total, payment) => total + (payment.amount || 0), 0),
      sessionsAttended: completedPayments.length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

module.exports = {
  getDashboardStats
};