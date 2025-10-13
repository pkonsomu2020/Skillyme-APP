const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// Debug endpoint to check table structure
router.get('/table-structure', async (req, res) => {
  try {
    console.log('🔍 Checking users table structure...');
    
    // Get column information
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .select();

    if (error) {
      console.error('❌ Error getting table structure:', error);
      // Fallback: try to get a sample user to see available fields
      const { data: sampleData, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        return res.status(500).json({
          success: false,
          message: 'Could not check table structure',
          error: sampleError.message
        });
      }
      
      const columns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
      
      return res.json({
        success: true,
        message: 'Table structure (from sample data)',
        columns: columns,
        sampleData: sampleData[0] || null
      });
    }

    res.json({
      success: true,
      message: 'Table structure retrieved',
      data
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint failed',
      error: error.message
    });
  }
});

// Debug endpoint to test enhanced fields
router.get('/test-enhanced-fields', async (req, res) => {
  try {
    console.log('🔍 Testing enhanced fields...');
    
    // Get users with enhanced fields
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, name, email, preferred_name, date_of_birth, 
        course_of_study, degree, year_of_study, 
        primary_field_interest, signup_source
      `)
      .limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Could not fetch users with enhanced fields',
        error: error.message
      });
    }

    // Count how many users have enhanced field data
    const stats = {
      total_users: data.length,
      with_preferred_name: data.filter(u => u.preferred_name).length,
      with_date_of_birth: data.filter(u => u.date_of_birth).length,
      with_course_of_study: data.filter(u => u.course_of_study).length,
      with_degree: data.filter(u => u.degree).length,
      with_year_of_study: data.filter(u => u.year_of_study).length,
      with_primary_field_interest: data.filter(u => u.primary_field_interest).length,
      with_signup_source: data.filter(u => u.signup_source).length
    };

    res.json({
      success: true,
      message: 'Enhanced fields test completed',
      stats,
      sample_users: data
    });
  } catch (error) {
    console.error('❌ Enhanced fields test error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced fields test failed',
      error: error.message
    });
  }
});

module.exports = router;