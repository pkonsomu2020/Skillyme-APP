const supabase = require('../config/supabase');
const { body, validationResult } = require('express-validator');
const ErrorHandler = require('../middleware/errorHandler');

// Get all users with filters and search
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      field_of_study,
      institution,
      county,
      status = 'active',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id, name, email, phone, country, county, field_of_study, institution, level_of_study,
        created_at, updated_at, password, preferred_name, date_of_birth, course_of_study, 
        degree, year_of_study, primary_field_interest, signup_source
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status === 'active') {
      // Only active users (no specific status field, so we get all)
    } else if (status === 'inactive') {
      // For now, we'll assume all users are active since we don't have a status field
      // This would need to be implemented with a status field in the users table
    }

    if (field_of_study) {
      query = query.eq('field_of_study', field_of_study);
    }

    if (institution) {
      query = query.ilike('institution', `%${institution}%`);
    }

    if (county) {
      query = query.eq('county', county);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (field_of_study) {
      countQuery = countQuery.eq('field_of_study', field_of_study);
    }

    if (institution) {
      countQuery = countQuery.ilike('institution', `%${institution}%`);
    }

    if (county) {
      countQuery = countQuery.eq('county', county);
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        users,
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
      endpoint: '/api/admin/users',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get single user with details
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, phone, country, county, field_of_study, institution, level_of_study,
        preferred_name, date_of_birth, course_of_study, degree, year_of_study,
        primary_field_interest, signup_source, created_at, updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      throw error;
    }

    // Get user's session history
    const { data: sessionHistory, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        id, session_id, joined_at, attendance_status,
        sessions!inner(id, title, date, time, recruiter, company)
      `)
      .eq('user_id', id)
      .order('joined_at', { ascending: false });

    if (sessionError) {
      throw sessionError;
    }

    // Get user's payment history
    const { data: paymentHistory, error: paymentError } = await supabase
      .from('payments')
      .select(`
        payment_id, session_id, amount, status, submission_date,
        sessions!inner(id, title, date, time)
      `)
      .eq('user_id', id)
      .order('submission_date', { ascending: false });

    if (paymentError) {
      throw paymentError;
    }

    res.json({
      success: true,
      data: {
        user,
        sessionHistory: sessionHistory || [],
        paymentHistory: paymentHistory || []
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/users/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Update user status (suspend/reactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value'
      });
    }

    // Note: This would require adding an is_active field to the users table
    // For now, we'll return a message indicating this feature needs implementation
    res.json({
      success: true,
      message: 'User status update feature requires database schema update',
      data: {
        userId: id,
        is_active,
        note: 'Add is_active column to users table to enable this feature'
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/users/${req.params.id}/status`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw usersError;
    }

    // Get users by field of study
    const { data: fieldStats, error: fieldError } = await supabase
      .from('users')
      .select('field_of_study')
      .not('field_of_study', 'is', null);

    if (fieldError) {
      throw fieldError;
    }

    // Count by field of study
    const fieldCounts = {};
    fieldStats.forEach(user => {
      const field = user.field_of_study;
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });

    // Get users by institution
    const { data: institutionStats, error: institutionError } = await supabase
      .from('users')
      .select('institution')
      .not('institution', 'is', null);

    if (institutionError) {
      throw institutionError;
    }

    // Count by institution
    const institutionCounts = {};
    institutionStats.forEach(user => {
      const institution = user.institution;
      institutionCounts[institution] = (institutionCounts[institution] || 0) + 1;
    });

    // Get signup trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (recentError) {
      throw recentError;
    }

    // Group by date
    const dailySignups = {};
    recentUsers.forEach(user => {
      const date = user.created_at.split('T')[0];
      dailySignups[date] = (dailySignups[date] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        fieldOfStudyStats: fieldCounts,
        institutionStats: institutionCounts,
        dailySignups: dailySignups,
        recentSignups: recentUsers?.length || 0
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/users/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Delete user (for cleanup purposes)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      throw checkError;
    }

    // Delete related records first (to maintain referential integrity)
    // Delete user sessions
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', id);

    if (sessionError) {
      console.warn('Error deleting user sessions:', sessionError);
    }

    // Delete payments
    const { error: paymentError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', id);

    if (paymentError) {
      console.warn('Error deleting user payments:', paymentError);
    }

    // Finally delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: existingUser
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: `/api/admin/users/${req.params.id}`,
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Bulk delete test users and reorganize IDs
const cleanupTestUsers = async (req, res) => {
  try {
    // Identify test users based on patterns
    const testPatterns = [
      'test.', 'debug.', 'enhanced.', 'schema.test', 'direct.test', 
      'api.test', 'fixed.test', 'perftest', 'simple.test', '@skillyme.com',
      'Test User', 'Debug Test User', 'API Test User', 'Schema Test User',
      'Direct Test User', 'Fixed Test User', 'Performance Test User',
      'Simple Test User', 'Test Enhanced User'
    ];

    // Get all users to identify test users
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email')
      .order('id', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    // Identify test users
    const testUsers = allUsers.filter(user => {
      const nameMatch = testPatterns.some(pattern => 
        user.name.toLowerCase().includes(pattern.toLowerCase())
      );
      const emailMatch = testPatterns.some(pattern => 
        user.email.toLowerCase().includes(pattern.toLowerCase())
      );
      return nameMatch || emailMatch;
    });

    console.log(`Found ${testUsers.length} test users to delete:`, testUsers.map(u => u.email));

    // Delete test users
    const deletedUsers = [];
    for (const testUser of testUsers) {
      try {
        // Delete related records first
        await supabase.from('user_sessions').delete().eq('user_id', testUser.id);
        await supabase.from('payments').delete().eq('user_id', testUser.id);
        
        // Delete the user
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', testUser.id);

        if (!deleteError) {
          deletedUsers.push(testUser);
        }
      } catch (error) {
        console.error(`Error deleting user ${testUser.id}:`, error);
      }
    }

    // Get remaining users for ID reorganization
    const { data: remainingUsers, error: remainingError } = await supabase
      .from('users')
      .select('id, name, email, phone, country, county, field_of_study, institution, level_of_study, preferred_name, date_of_birth, course_of_study, degree, year_of_study, primary_field_interest, signup_source, created_at, updated_at, password')
      .order('created_at', { ascending: true });

    if (remainingError) {
      throw remainingError;
    }

    // Note: ID reorganization would require more complex operations
    // For now, we'll just return the cleanup results
    res.json({
      success: true,
      message: 'Test users cleanup completed',
      data: {
        deletedCount: deletedUsers.length,
        deletedUsers: deletedUsers,
        remainingCount: remainingUsers.length,
        note: 'ID reorganization requires additional database operations'
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/users/cleanup',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup test users',
      error: error.message
    });
  }
};

// Get filter options for users
const getFilterOptions = async (req, res) => {
  try {
    // Get unique field of study options
    const { data: fieldOptions, error: fieldError } = await supabase
      .from('users')
      .select('field_of_study')
      .not('field_of_study', 'is', null)
      .not('field_of_study', 'eq', '');

    if (fieldError) {
      throw fieldError;
    }

    // Get unique institution options
    const { data: institutionOptions, error: institutionError } = await supabase
      .from('users')
      .select('institution')
      .not('institution', 'is', null)
      .not('institution', 'eq', '');

    if (institutionError) {
      throw institutionError;
    }

    // Get unique county options
    const { data: countyOptions, error: countyError } = await supabase
      .from('users')
      .select('county')
      .not('county', 'is', null)
      .not('county', 'eq', '');

    if (countyError) {
      throw countyError;
    }

    // Get unique signup source options
    const { data: signupSourceOptions, error: signupError } = await supabase
      .from('users')
      .select('signup_source')
      .not('signup_source', 'is', null)
      .not('signup_source', 'eq', '');

    if (signupError) {
      throw signupError;
    }

    // Remove duplicates and sort
    const uniqueFields = [...new Set(fieldOptions.map(item => item.field_of_study))].sort();
    const uniqueInstitutions = [...new Set(institutionOptions.map(item => item.institution))].sort();
    const uniqueCounties = [...new Set(countyOptions.map(item => item.county))].sort();
    const uniqueSignupSources = [...new Set(signupSourceOptions.map(item => item.signup_source))].sort();

    res.json({
      success: true,
      data: {
        fieldOfStudy: uniqueFields,
        institutions: uniqueInstitutions,
        counties: uniqueCounties,
        signupSources: uniqueSignupSources
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/users/filter-options',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserStats,
  getFilterOptions,
  deleteUser,
  cleanupTestUsers
};
