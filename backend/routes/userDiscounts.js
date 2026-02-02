const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const supabaseAdmin = require('../config/supabaseAdmin');

// Get user's discounts
router.get('/discounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's discounts from database
    const { data: discounts, error } = await supabaseAdmin
      .from('user_discounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        discounts: discounts || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching user discounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user discounts',
      error: error.message
    });
  }
});

// Get user's points summary
router.get('/points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's points from user_points table
    const { data: pointsData, error: pointsError } = await supabaseAdmin
      .from('user_points')
      .select('total_points, available_points, level_name')
      .eq('user_id', userId)
      .single();
    
    if (pointsError && pointsError.code !== 'PGRST116') {
      throw pointsError;
    }
    
    // Get recent point transactions
    const { data: transactions, error: transError } = await supabaseAdmin
      .from('point_transactions')
      .select('points_amount, transaction_type, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transError) {
      console.warn('Error fetching point transactions:', transError);
    }
    
    res.json({
      success: true,
      data: {
        points: pointsData || { total_points: 0, available_points: 0, level_name: 'Beginner' },
        recentTransactions: transactions || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user points',
      error: error.message
    });
  }
});

module.exports = router;