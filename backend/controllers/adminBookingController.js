const supabase = require('../config/supabase');
const ErrorHandler = require('../middleware/errorHandler');

// Get all bookings (user_sessions with payment info)
const getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      session_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_sessions')
      .select(`
        id, user_id, session_id, attendance_status, feedback, created_at,
        users!inner(id, name, email, phone, field_of_study, institution),
        sessions!inner(id, title, date, time, recruiter, company, price),
        payments!inner(payment_id, amount, status, mpesa_code, submission_date)
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('attendance_status', status);
    }

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (status) {
      countQuery = countQuery.eq('attendance_status', status);
    }

    if (session_id) {
      countQuery = countQuery.eq('session_id', session_id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        bookings: bookings || [],
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
      endpoint: '/api/admin/bookings',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('user_sessions')
      .select(`
        id, user_id, session_id, attendance_status, feedback, created_at,
        users!inner(id, name, email, phone, field_of_study, institution, county, country),
        sessions!inner(id, title, description, date, time, recruiter, company, price, google_meet_link),
        payments!inner(payment_id, amount, actual_amount, status, mpesa_code, submission_date, full_mpesa_message)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/bookings/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
};

// Update booking attendance status
const updateBookingStatus = async (req, res) => {
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
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: data[0] }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/bookings/${req.params.id}/status`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    // Get total bookings
    const { count: totalBookings, error: totalError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw totalError;
    }

    // Get bookings by status
    const { data: statusData, error: statusError } = await supabase
      .from('user_sessions')
      .select('attendance_status');

    if (statusError) {
      throw statusError;
    }

    const statusStats = {};
    statusData.forEach(booking => {
      const status = booking.attendance_status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    // Get recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentBookings, error: recentError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    res.json({
      success: true,
      data: {
        totalBookings: totalBookings || 0,
        statusStats,
        recentBookings: recentBookings || 0
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/bookings/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats
};