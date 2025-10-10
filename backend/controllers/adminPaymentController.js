const supabase = require('../config/supabase');
const ErrorHandler = require('../middleware/errorHandler');

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      session_id,
      user_id,
      search,
      sort_by = 'submission_date',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('payments')
      .select(`
        payment_id, user_id, session_id, mpesa_code, amount, actual_amount,
        amount_mismatch, status, admin_notes, submission_date, created_at,
        users!inner(id, name, email, phone, field_of_study, institution),
        sessions!inner(id, title, date, time, recruiter, company, price)
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (search) {
      query = query.or(`mpesa_code.ilike.%${search}%,users.name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    const { data: payments, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (session_id) {
      countQuery = countQuery.eq('session_id', session_id);
    }

    if (user_id) {
      countQuery = countQuery.eq('user_id', user_id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        payments: payments || [],
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
      endpoint: '/api/admin/payments',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        payment_id, user_id, session_id, mpesa_code, amount, actual_amount,
        amount_mismatch, status, admin_notes, submission_date, created_at, full_mpesa_message,
        users!inner(id, name, email, phone, field_of_study, institution, county, country),
        sessions!inner(id, title, description, date, time, recruiter, company, price, google_meet_link)
      `)
      .eq('payment_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      throw error;
    }

    // Get related user session if exists
    const { data: userSession, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id, attendance_status, feedback, created_at')
      .eq('user_id', payment.user_id)
      .eq('session_id', payment.session_id)
      .single();

    // Don't throw error if no user session found, it's optional

    res.json({
      success: true,
      data: { 
        payment,
        user_session: userSession || null
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/payments/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'amount_mismatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be: pending, paid, failed, or amount_mismatch'
      });
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment: data[0] }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/payments/${req.params.id}/status`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    // Get all payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select('payment_id, amount, actual_amount, status, submission_date, amount_mismatch');

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');
    const mismatchPayments = payments.filter(p => p.amount_mismatch === true);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.actual_amount || p.amount || 0), 0);
    const expectedRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Payment status distribution
    const statusStats = {};
    payments.forEach(payment => {
      const status = payment.status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = payments.filter(p => 
      new Date(p.submission_date) >= thirtyDaysAgo && p.status === 'paid'
    );

    const dailyRevenue = {};
    recentPayments.forEach(payment => {
      const date = payment.submission_date.split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (payment.actual_amount || payment.amount || 0);
    });

    const revenueData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        overview: {
          total_payments: totalPayments,
          paid_payments: paidPayments.length,
          pending_payments: pendingPayments.length,
          failed_payments: failedPayments.length,
          mismatch_payments: mismatchPayments.length,
          total_revenue: totalRevenue,
          expected_revenue: expectedRevenue,
          pending_revenue: pendingRevenue,
          success_rate: totalPayments > 0 ? Math.round((paidPayments.length / totalPayments) * 100) : 0
        },
        status_stats: statusStats,
        daily_revenue: revenueData
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/payments/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
};

// Bulk update payment statuses
const bulkUpdatePayments = async (req, res) => {
  try {
    const { payment_ids, status, admin_notes } = req.body;

    if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payment_ids must be a non-empty array'
      });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'amount_mismatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be: pending, paid, failed, or amount_mismatch'
      });
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .in('payment_id', payment_ids)
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `Successfully updated ${data.length} payments`,
      data: { 
        updated_count: data.length,
        payments: data 
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/payments/bulk-update',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update payments',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  bulkUpdatePayments
};