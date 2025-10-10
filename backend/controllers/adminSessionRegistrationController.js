const supabase = require('../config/supabase');
const ErrorHandler = require('../middleware/errorHandler');

// Get all session registrations
const getAllSessionRegistrations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      session_id,
      status,
      payment_status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_sessions')
      .select(`
        id, user_id, session_id, attendance_status, feedback, created_at,
        users!inner(id, name, email, phone, field_of_study, institution, county),
        sessions!inner(id, title, date, time, recruiter, company, price),
        payments!inner(payment_id, amount, actual_amount, status, mpesa_code, submission_date)
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    if (status) {
      query = query.eq('attendance_status', status);
    }

    const { data: registrations, error } = await query;

    if (error) {
      throw error;
    }

    // Filter by payment status if specified
    let filteredRegistrations = registrations || [];
    if (payment_status) {
      filteredRegistrations = filteredRegistrations.filter(reg => 
        reg.payments && reg.payments.status === payment_status
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (session_id) {
      countQuery = countQuery.eq('session_id', session_id);
    }

    if (status) {
      countQuery = countQuery.eq('attendance_status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        registrations: filteredRegistrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/session-registrations',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session registrations',
      error: error.message
    });
  }
};

// Get registration by ID
const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: registration, error } = await supabase
      .from('user_sessions')
      .select(`
        id, user_id, session_id, attendance_status, feedback, created_at,
        users!inner(id, name, email, phone, field_of_study, institution, county, country, level_of_study),
        sessions!inner(id, title, description, date, time, recruiter, company, price, google_meet_link, max_attendees),
        payments!inner(payment_id, amount, actual_amount, status, mpesa_code, submission_date, full_mpesa_message, admin_notes)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: { registration }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/session-registrations/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration details',
      error: error.message
    });
  }
};

// Get registrations for a specific session
const getSessionRegistrations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      page = 1, 
      limit = 50,
      status,
      payment_status 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_sessions')
      .select(`
        id, user_id, attendance_status, feedback, created_at,
        users!inner(id, name, email, phone, field_of_study, institution),
        payments!inner(payment_id, amount, status, mpesa_code, submission_date)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('attendance_status', status);
    }

    const { data: registrations, error } = await query;

    if (error) {
      throw error;
    }

    // Filter by payment status if specified
    let filteredRegistrations = registrations || [];
    if (payment_status) {
      filteredRegistrations = filteredRegistrations.filter(reg => 
        reg.payments && reg.payments.status === payment_status
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, title, date, time, recruiter, company, max_attendees, price')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Calculate registration statistics
    const stats = {
      total_registrations: filteredRegistrations.length,
      paid_registrations: filteredRegistrations.filter(r => r.payments?.status === 'paid').length,
      pending_payments: filteredRegistrations.filter(r => r.payments?.status === 'pending').length,
      attended: filteredRegistrations.filter(r => r.attendance_status === 'attended').length,
      absent: filteredRegistrations.filter(r => r.attendance_status === 'absent').length,
      registered: filteredRegistrations.filter(r => r.attendance_status === 'registered').length
    };

    res.json({
      success: true,
      data: {
        session,
        registrations: filteredRegistrations,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredRegistrations.length,
          pages: Math.ceil(filteredRegistrations.length / limit)
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/session-registrations/session/${req.params.sessionId}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session registrations',
      error: error.message
    });
  }
};

// Update registration status
const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance_status, feedback } = req.body;

    const validStatuses = ['registered', 'attended', 'absent'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status. Must be: registered, attended, or absent'
      });
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        attendance_status,
        feedback: feedback || null
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration status updated successfully',
      data: { registration: data[0] }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/session-registrations/${req.params.id}/status`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update registration status',
      error: error.message
    });
  }
};

// Get registration statistics
const getRegistrationStats = async (req, res) => {
  try {
    // Get total registrations
    const { count: totalRegistrations, error: totalError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw totalError;
    }

    // Get registrations by status
    const { data: statusData, error: statusError } = await supabase
      .from('user_sessions')
      .select('attendance_status');

    if (statusError) {
      throw statusError;
    }

    const statusStats = {};
    statusData.forEach(reg => {
      const status = reg.attendance_status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentRegistrations, error: recentError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    // Get payment statistics
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('status');

    if (paymentsError) {
      throw paymentsError;
    }

    const paymentStats = {};
    payments.forEach(payment => {
      const status = payment.status;
      paymentStats[status] = (paymentStats[status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_registrations: totalRegistrations || 0,
        attendance_stats: statusStats,
        payment_stats: paymentStats,
        recent_registrations: recentRegistrations || 0
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/session-registrations/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllSessionRegistrations,
  getRegistrationById,
  getSessionRegistrations,
  updateRegistrationStatus,
  getRegistrationStats
};