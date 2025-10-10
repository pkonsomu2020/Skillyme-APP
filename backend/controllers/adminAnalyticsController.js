const supabase = require('../config/supabase');
const ErrorHandler = require('../middleware/errorHandler');

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw usersError;
    }

    // Get active sessions
    const { count: activeSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_completed', false);

    if (sessionsError) {
      throw sessionsError;
    }

    // Get completed sessions
    const { count: completedSessions, error: completedError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true);

    if (completedError) {
      throw completedError;
    }

    // Get total revenue (from payments)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('status', 'paid');

    if (paymentsError) {
      throw paymentsError;
    }

    const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSignups, error: recentError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    // Get previous period signups (7-14 days ago) for growth calculation
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { count: previousSignups, error: previousError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    if (previousError) {
      throw previousError;
    }

    // Calculate growth rate
    const growthRate = previousSignups > 0 
      ? ((recentSignups - previousSignups) / previousSignups) * 100 
      : recentSignups > 0 ? 100 : 0;

    // Get top performing sessions (by attendees)
    const { data: topSessions, error: topSessionsError } = await supabase
      .from('sessions')
      .select(`
        id, title, recruiter, company, current_attendees, max_attendees,
        price, date, time, is_active, is_completed
      `)
      .order('current_attendees', { ascending: false })
      .limit(5);

    if (topSessionsError) {
      throw topSessionsError;
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || 0,
          activeSessions: activeSessions || 0,
          completedSessions: completedSessions || 0,
          totalRevenue: totalRevenue,
          recentSignups: recentSignups || 0,
          growthRate: growthRate
        },
        topSessions: topSessions || []
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/analytics/dashboard',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

// Get signup trends
const getSignupTrends = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const { data: signups, error } = await supabase
      .from('users')
      .select('created_at, signup_source, field_of_study')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by date
    const dailySignups = {};
    const sourceStats = {};
    const fieldStats = {};

    signups.forEach(user => {
      const date = user.created_at.split('T')[0];
      dailySignups[date] = (dailySignups[date] || 0) + 1;

      // Source stats
      const source = user.signup_source || 'Unknown';
      sourceStats[source] = (sourceStats[source] || 0) + 1;

      // Field stats
      const field = user.field_of_study || 'Unknown';
      fieldStats[field] = (fieldStats[field] || 0) + 1;
    });

    // Convert to array format for charts (weekly format for frontend)
    const dailyData = Object.entries(dailySignups).map(([date, count]) => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      signups: count
    }));

    const sourceData = Object.entries(sourceStats).map(([source, count]) => ({
      source,
      count
    }));

    const fieldData = Object.entries(fieldStats).map(([field, count]) => ({
      field,
      count
    }));

    res.json({
      success: true,
      data: {
        dailySignups: dailyData,
        sourceStats: sourceData,
        fieldStats: fieldData,
        totalSignups: signups.length
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/analytics/signup-trends',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signup trends',
      error: error.message
    });
  }
};

// Get session analytics
const getSessionAnalytics = async (req, res) => {
  try {
    // Get all sessions with attendee data
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id, title, recruiter, company, date, time, price,
        current_attendees, max_attendees, is_active, is_completed
      `)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate session statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.is_active && !s.is_completed).length;
    const completedSessions = sessions.filter(s => s.is_completed).length;
    const totalAttendees = sessions.reduce((sum, s) => sum + (s.current_attendees || 0), 0);
    const averageAttendees = totalSessions > 0 ? totalAttendees / totalSessions : 0;

    // Get top performing sessions
    const topSessions = sessions
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 10);

    // Get revenue by session
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        session_id, amount, status,
        sessions!inner(id, title, recruiter, company)
      `)
      .eq('status', 'paid');

    if (paymentsError) {
      throw paymentsError;
    }

    // Calculate revenue by session
    const revenueBySession = {};
    payments.forEach(payment => {
      const sessionId = payment.session_id;
      if (!revenueBySession[sessionId]) {
        revenueBySession[sessionId] = {
          sessionId,
          title: payment.sessions.title,
          recruiter: payment.sessions.recruiter,
          company: payment.sessions.company,
          revenue: 0,
          attendees: 0
        };
      }
      revenueBySession[sessionId].revenue += payment.amount || 0;
      revenueBySession[sessionId].attendees += 1;
    });

    const topRevenueSessions = Object.values(revenueBySession)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          activeSessions,
          completedSessions,
          totalAttendees,
          averageAttendees: Math.round(averageAttendees * 100) / 100
        },
        topSessions,
        topRevenueSessions
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/analytics/sessions',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session analytics',
      error: error.message
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    // Get user statistics
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw usersError;
    }

    // Get users by field of study
    const { data: fieldData, error: fieldError } = await supabase
      .from('users')
      .select('field_of_study, primary_field_interest')
      .not('field_of_study', 'is', null);

    if (fieldError) {
      throw fieldError;
    }

    // Count by field of study
    const fieldStats = {};
    fieldData.forEach(user => {
      const field = user.field_of_study;
      fieldStats[field] = (fieldStats[field] || 0) + 1;
    });

    // Get users by institution
    const { data: institutionData, error: institutionError } = await supabase
      .from('users')
      .select('institution')
      .not('institution', 'is', null);

    if (institutionError) {
      throw institutionError;
    }

    // Count by institution
    const institutionStats = {};
    institutionData.forEach(user => {
      const institution = user.institution;
      institutionStats[institution] = (institutionStats[institution] || 0) + 1;
    });

    // Get users by county
    const { data: countyData, error: countyError } = await supabase
      .from('users')
      .select('county')
      .not('county', 'is', null);

    if (countyError) {
      throw countyError;
    }

    // Count by county
    const countyStats = {};
    countyData.forEach(user => {
      const county = user.county;
      countyStats[county] = (countyStats[county] || 0) + 1;
    });

    // Get signup source statistics
    const { data: sourceData, error: sourceError } = await supabase
      .from('users')
      .select('signup_source')
      .not('signup_source', 'is', null);

    if (sourceError) {
      throw sourceError;
    }

    // Count by signup source
    const sourceStats = {};
    sourceData.forEach(user => {
      const source = user.signup_source;
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    });

    // Get most active users (by session attendance)
    const { data: activeUsers, error: activeError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        users!inner(id, name, email, field_of_study, institution)
      `);

    if (activeError) {
      throw activeError;
    }

    // Count sessions per user
    const userSessionCounts = {};
    activeUsers.forEach(attendance => {
      const userId = attendance.user_id;
      if (!userSessionCounts[userId]) {
        userSessionCounts[userId] = {
          user: attendance.users,
          sessionCount: 0
        };
      }
      userSessionCounts[userId].sessionCount += 1;
    });

    const mostActiveUsers = Object.values(userSessionCounts)
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || 0
        },
        fieldOfStudyStats: fieldStats,
        institutionStats: institutionStats,
        countyStats: countyStats,
        signupSourceStats: sourceStats,
        mostActiveUsers: mostActiveUsers
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/analytics/users',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get all paid payments in the period
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        payment_id, amount, actual_amount, submission_date, status, session_id,
        sessions!inner(id, title, recruiter, company, date)
      `)
      .eq('status', 'paid')
      .gte('submission_date', daysAgo.toISOString())
      .order('submission_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate total revenue using actual_amount if available, otherwise amount
    const totalRevenue = payments.reduce((sum, payment) => {
      const revenue = payment.actual_amount || payment.amount || 0;
      return sum + revenue;
    }, 0);

    // Group by date
    const dailyRevenue = {};
    payments.forEach(payment => {
      const date = payment.submission_date.split('T')[0];
      const revenue = payment.actual_amount || payment.amount || 0;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    });

    // Convert to array format
    const dailyData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    }));

    // Group by session
    const sessionRevenue = {};
    payments.forEach(payment => {
      const sessionId = payment.session_id;
      const revenue = payment.actual_amount || payment.amount || 0;
      
      if (!sessionRevenue[sessionId]) {
        sessionRevenue[sessionId] = {
          sessionId,
          title: payment.sessions.title,
          recruiter: payment.sessions.recruiter,
          company: payment.sessions.company,
          revenue: 0,
          transactions: 0
        };
      }
      sessionRevenue[sessionId].revenue += revenue;
      sessionRevenue[sessionId].transactions += 1;
    });

    const topRevenueSessions = Object.values(sessionRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get all payments for comparison (not just paid ones)
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('payment_id, amount, actual_amount, status')
      .gte('submission_date', daysAgo.toISOString());

    if (allPaymentsError) {
      throw allPaymentsError;
    }

    const pendingRevenue = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const failedRevenue = allPayments
      .filter(p => p.status === 'failed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        pendingRevenue,
        failedRevenue,
        dailyRevenue: dailyData,
        topRevenueSessions,
        totalTransactions: payments.length,
        totalPayments: allPayments.length,
        successRate: allPayments.length > 0 ? Math.round((payments.length / allPayments.length) * 100) : 0
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/analytics/revenue',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

// Get user demographics
const getUserDemographics = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('field_of_study, level_of_study, created_at');

    if (error) {
      throw error;
    }

    // Process demographics
    const demographics = {
      byField: {},
      byExperience: {},
      byMonth: {}
    };

    users.forEach(user => {
      // Group by field of study
      const field = user.field_of_study || 'Not specified';
      demographics.byField[field] = (demographics.byField[field] || 0) + 1;

      // Group by level of study
      const level = user.level_of_study || 'Not specified';
      demographics.byExperience[level] = (demographics.byExperience[level] || 0) + 1;

      // Group by month
      const month = new Date(user.created_at).toISOString().substring(0, 7);
      demographics.byMonth[month] = (demographics.byMonth[month] || 0) + 1;
    });

    res.json({
      success: true,
      data: demographics
    });
  } catch (error) {
    console.error('User demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user demographics',
      error: error.message
    });
  }
};

// Get session performance
const getSessionPerformance = async (req, res) => {
  try {
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*');

    if (sessionsError) {
      throw sessionsError;
    }

    const { data: userSessions, error: userSessionsError } = await supabase
      .from('user_sessions')
      .select('*');

    if (userSessionsError) {
      throw userSessionsError;
    }

    // Calculate performance metrics
    const performance = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.is_completed).length,
      activeSessions: sessions.filter(s => s.is_active && !s.is_completed).length,
      totalParticipants: userSessions.length,
      averageParticipants: sessions.length > 0 ? Math.round(userSessions.length / sessions.length) : 0,
      completionRate: sessions.length > 0 ? Math.round((sessions.filter(s => s.is_completed).length / sessions.length) * 100) : 0
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Session performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session performance',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSignupTrends,
  getSessionAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getUserDemographics,
  getSessionPerformance
};
