const express = require('express');
const { authenticateAdminToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// Get all users and their session access status for a specific session
router.get('/session/:sessionId/users', authenticateAdminToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all users first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    
    if (usersError) {
      throw usersError;
    }
    
    // Get session access data for this session
    const { data: accessData, error: accessError } = await supabase
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
router.post('/grant-access', authenticateAdminToken, async (req, res) => {
  try {
    const { userId, sessionId, accessGranted, adminNotes } = req.body;
    const adminId = req.admin.id;
    
    if (!userId || !sessionId || typeof accessGranted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'userId, sessionId, and accessGranted are required'
      });
    }
    
    // Check if record exists
    const { data: existingRecord, error: checkError } = await supabase
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
      // Update existing record
      const { data, error } = await supabase
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
      // Create new record
      const { data, error } = await supabase
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