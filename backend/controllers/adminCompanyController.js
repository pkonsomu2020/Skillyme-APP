const supabase = require('../config/supabase');
const ErrorHandler = require('../middleware/errorHandler');

// Get all companies (extracted from sessions)
const getAllCompanies = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      sort_by = 'session_count',
      sort_order = 'desc'
    } = req.query;

    // Get all sessions with company data
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('company, recruiter, price, is_active, is_completed, created_at');

    if (error) {
      throw error;
    }

    // Group by company and calculate stats
    const companyStats = {};
    sessions.forEach(session => {
      const company = session.company || 'Unknown Company';
      
      if (!companyStats[company]) {
        companyStats[company] = {
          name: company,
          session_count: 0,
          active_sessions: 0,
          completed_sessions: 0,
          total_revenue: 0,
          recruiters: new Set(),
          first_session: session.created_at,
          last_session: session.created_at
        };
      }

      const stats = companyStats[company];
      stats.session_count += 1;
      
      if (session.is_active && !session.is_completed) {
        stats.active_sessions += 1;
      }
      
      if (session.is_completed) {
        stats.completed_sessions += 1;
      }
      
      stats.total_revenue += session.price || 0;
      stats.recruiters.add(session.recruiter);
      
      if (new Date(session.created_at) < new Date(stats.first_session)) {
        stats.first_session = session.created_at;
      }
      
      if (new Date(session.created_at) > new Date(stats.last_session)) {
        stats.last_session = session.created_at;
      }
    });

    // Convert to array and add recruiter count
    let companies = Object.values(companyStats).map(company => ({
      ...company,
      recruiter_count: company.recruiters.size,
      recruiters: Array.from(company.recruiters)
    }));

    // Apply search filter
    if (search) {
      companies = companies.filter(company => 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.recruiters.some(recruiter => 
          recruiter.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Sort companies
    companies.sort((a, b) => {
      const aValue = a[sort_by] || 0;
      const bValue = b[sort_by] || 0;
      
      if (sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = companies.length;
    const offset = (page - 1) * limit;
    const paginatedCompanies = companies.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        companies: paginatedCompanies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/companies',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
};

// Get company by name with detailed stats
const getCompanyByName = async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    // Get all sessions for this company
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id, title, description, date, time, recruiter, price, 
        is_active, is_completed, created_at, updated_at
      `)
      .eq('company', decodedName)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get payment data for this company's sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('session_id, amount, status, submission_date')
      .in('session_id', sessionIds)
      .eq('status', 'paid');

    if (paymentsError) {
      throw paymentsError;
    }

    // Get booking data for this company's sessions
    const { data: bookings, error: bookingsError } = await supabase
      .from('user_sessions')
      .select('session_id, attendance_status, created_at')
      .in('session_id', sessionIds);

    if (bookingsError) {
      throw bookingsError;
    }

    // Calculate company statistics
    const stats = {
      name: decodedName,
      total_sessions: sessions.length,
      active_sessions: sessions.filter(s => s.is_active && !s.is_completed).length,
      completed_sessions: sessions.filter(s => s.is_completed).length,
      total_revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      total_bookings: bookings.length,
      attended_bookings: bookings.filter(b => b.attendance_status === 'attended').length,
      recruiters: [...new Set(sessions.map(s => s.recruiter))],
      first_session: sessions[sessions.length - 1]?.created_at,
      last_session: sessions[0]?.created_at
    };

    // Calculate monthly revenue trend
    const monthlyRevenue = {};
    payments.forEach(payment => {
      const month = payment.submission_date.substring(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (payment.amount || 0);
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        company: stats,
        sessions,
        revenueData,
        recentBookings: bookings.slice(0, 10)
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/companies/${req.params.name}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details',
      error: error.message
    });
  }
};

// Get company statistics
const getCompanyStats = async (req, res) => {
  try {
    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('company, recruiter, price, is_active, is_completed');

    if (error) {
      throw error;
    }

    // Calculate stats
    const uniqueCompanies = new Set(sessions.map(s => s.company)).size;
    const uniqueRecruiters = new Set(sessions.map(s => s.recruiter)).size;
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.is_active && !s.is_completed).length;

    // Top companies by session count
    const companySessionCounts = {};
    sessions.forEach(session => {
      const company = session.company || 'Unknown';
      companySessionCounts[company] = (companySessionCounts[company] || 0) + 1;
    });

    const topCompanies = Object.entries(companySessionCounts)
      .map(([company, count]) => ({ company, session_count: count }))
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        total_companies: uniqueCompanies,
        total_recruiters: uniqueRecruiters,
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        top_companies: topCompanies
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/companies/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyByName,
  getCompanyStats
};