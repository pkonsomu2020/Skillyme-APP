const supabase = require('../config/supabase');
const { body, validationResult } = require('express-validator');
const ErrorHandler = require('../middleware/errorHandler');

// Get all sessions with filters
const getAllSessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      recruiter, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('sessions')
      .select(`
        id, title, description, date, time, google_meet_link, 
        recruiter, company, price, paybill_number, business_number,
        is_active, is_completed, max_attendees, current_attendees,
        poster_url, thumbnail_url, created_at, updated_at
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      if (status === 'active') {
        query = query.eq('is_active', true).eq('is_completed', false);
      } else if (status === 'completed') {
        query = query.eq('is_completed', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    if (recruiter) {
      query = query.ilike('recruiter', `%${recruiter}%`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,recruiter.ilike.%${search}%`);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase.from('sessions').select('*', { count: 'exact', head: true });
    
    if (status) {
      if (status === 'active') {
        countQuery = countQuery.eq('is_active', true).eq('is_completed', false);
      } else if (status === 'completed') {
        countQuery = countQuery.eq('is_completed', true);
      } else if (status === 'inactive') {
        countQuery = countQuery.eq('is_active', false);
      }
    }

    if (recruiter) {
      countQuery = countQuery.ilike('recruiter', `%${recruiter}%`);
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,recruiter.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        sessions,
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
      endpoint: '/api/admin/sessions',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// Get single session
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        id, title, description, date, time, google_meet_link,
        recruiter, company, price, paybill_number, business_number,
        is_active, is_completed, max_attendees, current_attendees,
        poster_url, thumbnail_url, created_at, updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/sessions/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message
    });
  }
};

// Create new session
const createSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Session creation validation failed'), {
        endpoint: '/api/admin/sessions',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      date,
      time,
      google_meet_link,
      recruiter,
      company,
      price = 0,
      paybill_number,
      business_number,
      max_attendees,
      poster_url,
      thumbnail_url
    } = req.body;

    const sessionData = {
      title: title?.trim(),
      description: description?.trim() || null,
      date,
      time,
      google_meet_link: google_meet_link?.trim() || null,
      recruiter: recruiter?.trim(),
      company: company?.trim(),
      price: parseFloat(price) || 0.00,
      paybill_number: paybill_number?.trim() || null,
      business_number: business_number?.trim() || null,
      max_attendees: max_attendees ? parseInt(max_attendees) : null,
      current_attendees: 0,
      poster_url: poster_url?.trim() || null,
      thumbnail_url: thumbnail_url?.trim() || null,
      is_active: true,
      is_completed: false
    };

    const { data: session, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select(`
        id, title, description, date, time, google_meet_link,
        recruiter, company, price, paybill_number, business_number,
        is_active, is_completed, max_attendees, current_attendees,
        poster_url, thumbnail_url, created_at, updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/sessions',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Session update validation failed'), {
        endpoint: `/api/admin/sessions/${req.params.id}`,
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      date,
      time,
      google_meet_link,
      recruiter,
      company,
      price,
      paybill_number,
      business_number,
      max_attendees,
      poster_url,
      thumbnail_url,
      is_active,
      is_completed
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title?.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (google_meet_link !== undefined) updateData.google_meet_link = google_meet_link?.trim() || null;
    if (recruiter !== undefined) updateData.recruiter = recruiter?.trim();
    if (company !== undefined) updateData.company = company?.trim();
    if (price !== undefined) updateData.price = parseFloat(price) || 0.00;
    if (paybill_number !== undefined) updateData.paybill_number = paybill_number?.trim() || null;
    if (business_number !== undefined) updateData.business_number = business_number?.trim() || null;
    if (max_attendees !== undefined) updateData.max_attendees = max_attendees ? parseInt(max_attendees) : null;
    if (poster_url !== undefined) updateData.poster_url = poster_url?.trim() || null;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url?.trim() || null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (is_completed !== undefined) updateData.is_completed = Boolean(is_completed);

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, title, description, date, time, google_meet_link,
        recruiter, company, price, paybill_number, business_number,
        is_active, is_completed, max_attendees, current_attendees,
        poster_url, thumbnail_url, created_at, updated_at
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/sessions/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

// Delete session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/sessions/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
};

// Get session attendees
const getSessionAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: attendees, error } = await supabase
      .from('user_sessions')
      .select(`
        id, user_id, session_id, joined_at, attendance_status,
        users!inner(id, name, email, phone, preferred_name)
      `)
      .eq('session_id', id)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id);

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        attendees,
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
      endpoint: `/api/admin/sessions/${req.params.id}/attendees`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session attendees',
      error: error.message
    });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionAttendees
};
