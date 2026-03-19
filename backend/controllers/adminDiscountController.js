const supabase = require('../config/supabase');
const { body, validationResult } = require('express-validator');
const ErrorHandler = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const UserPoints = require('../models/UserPoints');

// Points → Discount tier mapping
// More points = higher discount
const DISCOUNT_TIERS = [
  { minPoints: 200, discount: 30, label: 'Elite' },
  { minPoints: 100, discount: 20, label: 'Advanced' },
  { minPoints: 50,  discount: 15, label: 'Intermediate' },
  { minPoints: 20,  discount: 10, label: 'Explorer' },
  { minPoints: 5,   discount: 5,  label: 'Starter' },
];

function calculateDiscountForPoints(totalPoints) {
  for (const tier of DISCOUNT_TIERS) {
    if (totalPoints >= tier.minPoints) {
      return { discount: tier.discount, label: tier.label };
    }
  }
  return null; // Not eligible yet
}

// Auto-award or upgrade discount when user earns points
// Called internally after points are awarded
const autoUpdateUserDiscount = async (userId, totalPoints) => {
  try {
    const tier = calculateDiscountForPoints(totalPoints);
    if (!tier) return; // Not eligible yet

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Check existing active discount
    const { data: existing } = await supabase
      .from('user_discounts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existing) {
      // Only upgrade if new tier is higher
      if (tier.discount <= existing.discount_percentage) return;

      // Upgrade existing discount
      await supabase
        .from('user_discounts')
        .update({
          discount_percentage: tier.discount,
          reason: `Auto-upgraded to ${tier.label} tier — ${totalPoints} points earned`,
          user_points_at_award: totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new discount
      await supabase
        .from('user_discounts')
        .insert([{
          user_id: userId,
          discount_percentage: tier.discount,
          discount_type: 'next_phase',
          status: 'active',
          awarded_at: new Date().toISOString(),
          reason: `Auto-awarded ${tier.label} tier discount — ${totalPoints} points earned`,
          user_points_at_award: totalPoints
        }]);

      // Send email notification
      try {
        await emailService.sendDiscountAwardEmail(
          user.email,
          user.name,
          tier.discount,
          'next_phase',
          totalPoints,
          `You've reached ${totalPoints} points and unlocked a ${tier.discount}% discount!`
        );
      } catch (e) {
        console.warn('Discount email failed:', e.message);
      }
    }
  } catch (err) {
    console.error('autoUpdateUserDiscount error:', err.message);
  }
};


const getLeaderboardForDiscounts = async (req, res) => {
  try {
    const { 
      limit = 200, // Increased default to show more users
      period = 'all', 
      target_group = 'all',
      min_points = 10 
    } = req.query;

    // Get ALL users first (not just those with points)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id, name, email, phone, country, county, field_of_study, institution, level_of_study,
        preferred_name, date_of_birth, course_of_study, degree, year_of_study,
        primary_field_interest, signup_source, created_at, updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (usersError) throw usersError;

    if (!allUsers || allUsers.length === 0) {
      return res.json({
        success: true,
        data: {
          leaderboard: [],
          summary: {
            total_users: 0,
            eligible_users: 0,
            users_with_discounts: 0
          }
        }
      });
    }

    console.log(`Processing ${allUsers.length} users for discount eligibility`);

    // Enhance each user with points and discount data
    const enhancedData = await Promise.all(
      allUsers.map(async (user) => {
        try {
          // Get user points (may not exist for new users)
          const { data: pointsData, error: pointsError } = await supabase
            .from('user_points')
            .select('total_points, available_points, level_name')
            .eq('user_id', user.id)
            .single();

          if (pointsError && pointsError.code !== 'PGRST116') {
            console.warn(`Points error for user ${user.id}:`, pointsError);
          }

          // Default points for users without entries
          const userPoints = pointsData || {
            total_points: 0,
            available_points: 0,
            level_name: 'Beginner'
          };

          // Get assignment submissions for verification
          const { data: submissions, error: submissionError } = await supabase
            .from('assignment_submissions')
            .select(`
              id, assignment_id, status, points_earned, submitted_at,
              assignments(title)
            `)
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false });

          if (submissionError) {
            console.warn(`Submissions error for user ${user.id}:`, submissionError);
          }

          // Calculate assignment stats
          const totalSubmissions = submissions?.length || 0;
          const approvedSubmissions = submissions?.filter(s => s.status === 'approved') || [];
          const totalPointsEarned = approvedSubmissions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
          const averagePointsPerAssignment = approvedSubmissions.length > 0 
            ? totalPointsEarned / approvedSubmissions.length 
            : 0;

          // Check discount eligibility using points tier system
          const tierResult = calculateDiscountForPoints(userPoints.total_points);
          const isEligible = tierResult !== null;
          const meetsPoints = userPoints.total_points >= parseInt(min_points);

          // Get existing discount records
          const { data: existingDiscounts, error: discountError } = await supabase
            .from('user_discounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (discountError) {
            console.warn(`Discounts error for user ${user.id}:`, discountError);
          }

          const activeDiscount = existingDiscounts?.find(d => d.status === 'active');
          const canUpgrade = activeDiscount && tierResult && tierResult.discount > activeDiscount.discount_percentage;

          return {
            user_id: user.id,
            total_points: userPoints.total_points,
            available_points: userPoints.available_points,
            level_name: userPoints.level_name,
            users: {
              name: user.name,
              email: user.email,
              field_of_study: user.field_of_study,
              level_of_study: user.level_of_study
            },
            assignment_stats: {
              total_submissions: totalSubmissions,
              approved_submissions: approvedSubmissions.length,
              total_points_earned: totalPointsEarned,
              average_points_per_assignment: Math.round(averagePointsPerAssignment * 100) / 100,
              recent_submissions: submissions?.slice(0, 5) || []
            },
            discount_tier: tierResult,
            discount_eligibility: {
              is_eligible: isEligible && meetsPoints,
              can_upgrade: canUpgrade || false,
              suggested_discount: tierResult?.discount || 0,
              tier_label: tierResult?.label || 'Not eligible',
              points_requirement: parseInt(min_points),
              next_tier: DISCOUNT_TIERS.slice().reverse().find(t => t.minPoints > userPoints.total_points) || null,
              meets_points: meetsPoints,
              eligibility_reason: isEligible
                ? `${tierResult.label} tier — ${tierResult.discount}% discount (${userPoints.total_points} pts)`
                : `Earn ${5 - userPoints.total_points > 0 ? 5 - userPoints.total_points : 0} more points to unlock first discount`
            },
            existing_discounts: existingDiscounts || []
          };
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
          // Return default data for users that fail processing
          return {
            user_id: user.id,
            total_points: 0,
            available_points: 0,
            level_name: 'Beginner',
            users: {
              name: user.name,
              email: user.email,
              field_of_study: user.field_of_study,
              level_of_study: user.level_of_study
            },
            assignment_stats: { 
              total_submissions: 0, 
              approved_submissions: 0, 
              total_points_earned: 0,
              average_points_per_assignment: 0,
              recent_submissions: []
            },
            discount_eligibility: { 
              is_eligible: false,
              points_requirement: parseInt(min_points),
              assignments_requirement: 3,
              points_per_assignment_requirement: 15,
              high_points_threshold: 100,
              meets_points: false,
              meets_assignments: false,
              meets_points_per_assignment: false,
              has_high_points: false,
              eligibility_reason: 'Error processing user data'
            },
            existing_discounts: []
          };
        }
      })
    );

    // Sort by eligibility and points
    enhancedData.sort((a, b) => {
      if (a.discount_eligibility.is_eligible && !b.discount_eligibility.is_eligible) return -1;
      if (!a.discount_eligibility.is_eligible && b.discount_eligibility.is_eligible) return 1;
      return b.total_points - a.total_points;
    });

    console.log(`Processed ${enhancedData.length} users for discounts page`);

    res.json({
      success: true,
      data: {
        leaderboard: enhancedData,
        summary: {
          total_users: enhancedData.length,
          eligible_users: enhancedData.filter(u => u.discount_eligibility.is_eligible).length,
          users_with_discounts: enhancedData.filter(u => u.existing_discounts.length > 0).length,
          criteria: {
            tiers: DISCOUNT_TIERS,
            min_points: parseInt(min_points)
          }
        }
      }
    });

  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/discounts/leaderboard',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard for discounts',
      error: error.message
    });
  }
};

// Award discount to eligible user
const awardDiscount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      user_id, 
      discount_percentage, 
      discount_type = 'next_phase',
      valid_until,
      reason 
    } = req.body;

    // Verify user eligibility
    const userPoints = await UserPoints.getUserPoints(user_id);
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has an active discount — upgrade if new % is higher
    const { data: existingDiscount, error: existingError } = await supabase
      .from('user_discounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingDiscount) {
      if (parseInt(discount_percentage) <= existingDiscount.discount_percentage) {
        return res.status(400).json({
          success: false,
          message: `User already has an active ${existingDiscount.discount_percentage}% discount. Award a higher percentage to upgrade.`
        });
      }
      // Upgrade existing discount
      const { data: upgraded, error: upgradeError } = await supabase
        .from('user_discounts')
        .update({
          discount_percentage: parseInt(discount_percentage),
          reason: reason || `Upgraded to ${discount_percentage}% — ${userPoints.total_points} points`,
          user_points_at_award: userPoints.total_points,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDiscount.id)
        .select()
        .single();

      if (upgradeError) throw upgradeError;

      return res.json({
        success: true,
        message: `Discount upgraded to ${discount_percentage}% successfully`,
        data: { discount: upgraded, user: { id: user.id, name: user.name, email: user.email, points: userPoints.total_points } }
      });
    }

    // Create discount record
    const discountData = {
      user_id,
      discount_percentage: parseInt(discount_percentage),
      discount_type,
      status: 'active',
      awarded_by: req.admin.id,
      awarded_at: new Date().toISOString(),
      valid_until: valid_until || null,
      reason: reason || 'Performance-based discount for leaderboard achievement',
      user_points_at_award: userPoints.total_points
    };

    const { data: discount, error: discountError } = await supabase
      .from('user_discounts')
      .insert([discountData])
      .select()
      .single();

    if (discountError) {
      throw discountError;
    }

    // Send congratulatory email
    try {
      await emailService.sendDiscountAwardEmail(
        user.email,
        user.name,
        discount_percentage,
        discount_type,
        userPoints.total_points,
        reason
      );
    } catch (emailError) {
      console.error('Failed to send discount email:', emailError);
      // Don't fail the discount award if email fails
    }

    res.json({
      success: true,
      message: 'Discount awarded successfully',
      data: {
        discount,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          points: userPoints.total_points
        }
      }
    });

  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/discounts/award',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to award discount',
      error: error.message
    });
  }
};

// Get all discounts with user details
const getAllDiscounts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all',
      discount_type = 'all' 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_discounts')
      .select(`
        *,
        users(id, name, email, field_of_study, level_of_study),
        admins(name)
      `)
      .order('awarded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (discount_type !== 'all') {
      query = query.eq('discount_type', discount_type);
    }

    const { data: discounts, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count
    let countQuery = supabase
      .from('user_discounts')
      .select('*', { count: 'exact', head: true });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (discount_type !== 'all') {
      countQuery = countQuery.eq('discount_type', discount_type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        discounts,
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
      endpoint: '/api/admin/discounts',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discounts',
      error: error.message
    });
  }
};

// Bulk award discounts to top performers
const bulkAwardDiscounts = async (req, res) => {
  try {
    const { 
      top_count = 10, 
      discount_percentage = 20, 
      discount_type = 'next_phase',
      min_points = 10,
      reason = 'Top performer discount'
    } = req.body;

    // Get top performers
    const leaderboard = await UserPoints.getLeaderboard({
      limit: parseInt(top_count),
      period: 'all',
      target_group: 'all'
    });

    // Filter eligible users
    const eligibleUsers = leaderboard.filter(user => 
      user.total_points >= parseInt(min_points)
    );

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of eligibleUsers) {
      try {
        // Check if user already has active discount
        const { data: existingDiscount } = await supabase
          .from('user_discounts')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('status', 'active')
          .single();

        if (existingDiscount) {
          results.push({
            user_id: user.user_id,
            name: user.users?.name,
            status: 'skipped',
            reason: 'Already has active discount'
          });
          continue;
        }

        // Award discount
        const { data: discount, error: discountError } = await supabase
          .from('user_discounts')
          .insert([{
            user_id: user.user_id,
            discount_percentage: parseInt(discount_percentage),
            discount_type,
            status: 'active',
            awarded_by: req.admin.id,
            awarded_at: new Date().toISOString(),
            reason,
            user_points_at_award: user.total_points
          }])
          .select()
          .single();

        if (discountError) {
          throw discountError;
        }

        // Send email
        try {
          await emailService.sendDiscountAwardEmail(
            user.users?.email,
            user.users?.name,
            discount_percentage,
            discount_type,
            user.total_points,
            reason
          );
        } catch (emailError) {
          console.error(`Email failed for user ${user.user_id}:`, emailError);
        }

        results.push({
          user_id: user.user_id,
          name: user.users?.name,
          status: 'success',
          discount_id: discount.id
        });
        successCount++;

      } catch (error) {
        results.push({
          user_id: user.user_id,
          name: user.users?.name,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk discount award completed`,
      data: {
        summary: {
          total_processed: eligibleUsers.length,
          successful: successCount,
          errors: errorCount,
          skipped: results.filter(r => r.status === 'skipped').length
        },
        results
      }
    });

  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/discounts/bulk-award',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to bulk award discounts',
      error: error.message
    });
  }
};

module.exports = {
  getLeaderboardForDiscounts,
  awardDiscount,
  getAllDiscounts,
  bulkAwardDiscounts,
  autoUpdateUserDiscount,
  calculateDiscountForPoints,
  DISCOUNT_TIERS
};