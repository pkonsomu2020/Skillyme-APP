const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const supabaseAdmin = require('../config/supabaseAdmin');

// Get user's discounts
router.get('/discounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's discounts from database using correct column names
    const { data: discounts, error } = await supabaseAdmin
      .from('user_discounts')
      .select(`
        id,
        discount_percentage,
        discount_type,
        status,
        awarded_at,
        used_at,
        valid_until,
        reason,
        user_points_at_award,
        discount_code,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format discounts for frontend
    const formattedDiscounts = discounts?.map(discount => ({
      id: discount.id,
      percentage: discount.discount_percentage,
      type: discount.discount_type,
      status: discount.status,
      awardedAt: discount.awarded_at,
      usedAt: discount.used_at,
      validUntil: discount.valid_until,
      reason: discount.reason,
      pointsAtAward: discount.user_points_at_award,
      code: discount.discount_code,
      createdAt: discount.created_at,
      isExpired: discount.valid_until ? new Date(discount.valid_until) < new Date() : false,
      isUsed: !!discount.used_at
    })) || [];
    
    res.json({
      success: true,
      data: {
        discounts: formattedDiscounts
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
      .from('points_transactions')  // Changed from point_transactions to points_transactions
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