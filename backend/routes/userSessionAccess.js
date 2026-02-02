// User Session Access Management Routes
// Handles admin-controlled session access with RLS bypass using service role key
const express = require('express');
const { authenticateAdmin } = require('../middleware/adminAuth');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabaseAdmin'); // Admin client for RLS bypass

const router = express.Router();

// Get all users and their session access status for a specific session
router.get('/session/:sessionId/users', authenticateAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all users first using admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    
    if (usersError) {
      throw usersError;
    }
    
    // Get session access data for this session using admin client
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('user_session_access')
      .select('*')
      .eq('session_id', sessionId);
    
    if (accessError) {
      console.warn('Could not fetch session access data:', accessError);
    }
    
    // Combine users with their access status
    const usersWithAccess = users.map(user => {
      const access = accessData ? accessData.find(a => a.user_id === user.id) : null;
      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        county: user.county,
        field_of_study: user.field_of_study,
        institution: user.institution,
        level_of_study: user.level_of_study,
        created_at: user.created_at,
        updated_at: user.updated_at,
        preferred_name: user.preferred_name,
        date_of_birth: user.date_of_birth,
        course_of_study: user.course_of_study,
        degree: user.degree,
        year_of_study: user.year_of_study,
        primary_field_interest: user.primary_field_interest,
        signup_source: user.signup_source,
        access_granted: access ? access.access_granted : null,
        admin_notes: access ? access.admin_notes : null,
        granted_at: access ? access.granted_at : null,
        granted_by: access ? access.granted_by : null
      };
    });
    
    res.json({
      success: true,
      data: {
        users: usersWithAccess
      }
    });
  } catch (error) {
    console.error('Error fetching users for session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for session',
      error: error.message
    });
  }
});

// Grant or revoke access for a user to a specific session
router.post('/grant-access', authenticateAdmin, async (req, res) => {
  try {
    const { userId, sessionId, accessGranted, adminNotes } = req.body;
    const adminId = req.admin.id;
    
    if (!userId || !sessionId || typeof accessGranted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'userId, sessionId, and accessGranted are required'
      });
    }
    
    // Use admin client to bypass RLS
    // Check if record exists
    const { data: existingRecord, error: checkError } = await supabaseAdmin
      .from('user_session_access')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError;
    }
    
    let result;
    
    if (existingRecord) {
      // Update existing record using admin client
      const { data, error } = await supabaseAdmin
        .from('user_session_access')
        .update({
          access_granted: accessGranted,
          admin_notes: adminNotes,
          granted_by: adminId,
          granted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new record using admin client
      const { data, error } = await supabaseAdmin
        .from('user_session_access')
        .insert({
          user_id: userId,
          session_id: sessionId,
          access_granted: accessGranted,
          admin_notes: adminNotes,
          granted_by: adminId
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    res.json({
      success: true,
      message: `Access ${accessGranted ? 'granted' : 'revoked'} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error managing session access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage session access',
      error: error.message
    });
  }
});

// Get user's session access status (for frontend to check if join button should be enabled)
router.get('/user/:userId/session/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    const { data, error } = await supabase
      .from('user_session_access')
      .select('access_granted, granted_at, admin_notes')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    const hasAccess = data ? data.access_granted : false;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        accessDetails: data || null
      }
    });
  } catch (error) {
    console.error('Error checking session access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session access',
      error: error.message
    });
  }
});

module.exports = router;