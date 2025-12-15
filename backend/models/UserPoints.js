const supabase = require('../config/supabase');

class UserPoints {
  static async getUserPoints(userId) {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create initial points record if doesn't exist
      return await this.initializeUserPoints(userId);
    }

    if (error) throw error;
    return data;
  }

  static async initializeUserPoints(userId) {
    const { data, error } = await supabase
      .from('user_points')
      .insert([{
        user_id: userId,
        total_points: 0,
        points_spent: 0,
        available_points: 0,
        level_name: 'Beginner',
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addPoints(userId, points, source_type, source_id, description) {
    // Get current points
    let userPoints = await this.getUserPoints(userId);

    // Update points
    const newTotalPoints = userPoints.total_points + points;
    const newAvailablePoints = userPoints.available_points + points;
    const newLevel = this.calculateLevel(newTotalPoints);

    const { data, error } = await supabase
      .from('user_points')
      .update({
        total_points: newTotalPoints,
        available_points: newAvailablePoints,
        level_name: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Record transaction
    await this.recordTransaction(userId, 'earned', points, source_type, source_id, description);

    return data;
  }

  static async spendPoints(userId, points, source_type, source_id, description) {
    const userPoints = await this.getUserPoints(userId);

    if (userPoints.available_points < points) {
      throw new Error('Insufficient points');
    }

    const newAvailablePoints = userPoints.available_points - points;
    const newPointsSpent = userPoints.points_spent + points;

    const { data, error } = await supabase
      .from('user_points')
      .update({
        available_points: newAvailablePoints,
        points_spent: newPointsSpent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Record transaction
    await this.recordTransaction(userId, 'spent', points, source_type, source_id, description);

    return data;
  }

  static async recordTransaction(userId, type, amount, source_type, source_id, description) {
    const { data, error } = await supabase
      .from('points_transactions')
      .insert([{
        user_id: userId,
        transaction_type: type,
        points_amount: amount,
        source_type,
        source_id,
        description,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTransactionHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static calculateLevel(totalPoints) {
    if (totalPoints >= 1000) return 'Expert';
    if (totalPoints >= 500) return 'Advanced';
    if (totalPoints >= 250) return 'Intermediate';
    if (totalPoints >= 100) return 'Explorer';
    return 'Beginner';
  }

  static async getLeaderboard(options = {}) {
    const { 
      limit = 10, 
      period = 'all', 
      target_group = 'all', 
      metric = 'points' 
    } = options;

    let query = supabase
      .from('user_points')
      .select(`
        *,
        users(name, email, level_of_study, field_of_study, created_at)
      `);

    // Filter by target group based on user's level of study
    if (target_group === 'form4') {
      query = query.or('users.level_of_study.ilike.%form%,users.level_of_study.ilike.%secondary%,users.level_of_study.ilike.%high school%');
    } else if (target_group === 'undergraduate') {
      query = query.or('users.level_of_study.ilike.%undergraduate%,users.level_of_study.ilike.%bachelor%,users.level_of_study.ilike.%university%');
    }

    // Handle time period filtering
    if (period === 'weekly' || period === 'monthly') {
      // For time-based filtering, we need to calculate points from transactions
      const daysBack = period === 'weekly' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get users with their recent points from transactions
      const { data: recentTransactions, error: transError } = await supabase
        .from('points_transactions')
        .select(`
          user_id,
          points_amount,
          created_at,
          users(name, email, level_of_study, field_of_study)
        `)
        .eq('transaction_type', 'earned')
        .gte('created_at', startDate.toISOString());

      if (transError) throw transError;

      // Aggregate points by user for the period
      const userPointsMap = {};
      recentTransactions?.forEach(transaction => {
        const userId = transaction.user_id;
        if (!userPointsMap[userId]) {
          userPointsMap[userId] = {
            user_id: userId,
            period_points: 0,
            users: transaction.users
          };
        }
        userPointsMap[userId].period_points += transaction.points_amount;
      });

      // Convert to array and sort
      let leaderboardData = Object.values(userPointsMap);
      
      // Apply target group filter
      if (target_group !== 'all') {
        leaderboardData = leaderboardData.filter(user => {
          const levelOfStudy = user.users?.level_of_study?.toLowerCase() || '';
          if (target_group === 'form4') {
            return levelOfStudy.includes('form') || levelOfStudy.includes('secondary') || levelOfStudy.includes('high school');
          } else if (target_group === 'undergraduate') {
            return levelOfStudy.includes('undergraduate') || levelOfStudy.includes('bachelor') || levelOfStudy.includes('university');
          }
          return true;
        });
      }

      // Sort by period points and limit
      leaderboardData.sort((a, b) => b.period_points - a.period_points);
      return leaderboardData.slice(0, limit);
    }

    // For 'all' period, use existing total points
    if (metric === 'assignments') {
      // Get assignment completion count for each user
      const { data: assignmentCounts, error: assignError } = await supabase
        .from('assignment_submissions')
        .select(`
          user_id,
          users(name, email, level_of_study, field_of_study)
        `)
        .eq('status', 'approved');

      if (assignError) throw assignError;

      // Count assignments per user
      const userAssignmentMap = {};
      assignmentCounts?.forEach(submission => {
        const userId = submission.user_id;
        if (!userAssignmentMap[userId]) {
          userAssignmentMap[userId] = {
            user_id: userId,
            assignments_completed: 0,
            users: submission.users
          };
        }
        userAssignmentMap[userId].assignments_completed += 1;
      });

      let leaderboardData = Object.values(userAssignmentMap);
      
      // Apply target group filter
      if (target_group !== 'all') {
        leaderboardData = leaderboardData.filter(user => {
          const levelOfStudy = user.users?.level_of_study?.toLowerCase() || '';
          if (target_group === 'form4') {
            return levelOfStudy.includes('form') || levelOfStudy.includes('secondary') || levelOfStudy.includes('high school');
          } else if (target_group === 'undergraduate') {
            return levelOfStudy.includes('undergraduate') || levelOfStudy.includes('bachelor') || levelOfStudy.includes('university');
          }
          return true;
        });
      }

      leaderboardData.sort((a, b) => b.assignments_completed - a.assignments_completed);
      return leaderboardData.slice(0, limit);
    }

    // Default: sort by total points
    query = query.order('total_points', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    // Apply target group filter if needed
    if (target_group !== 'all' && data) {
      return data.filter(user => {
        const levelOfStudy = user.users?.level_of_study?.toLowerCase() || '';
        if (target_group === 'form4') {
          return levelOfStudy.includes('form') || levelOfStudy.includes('secondary') || levelOfStudy.includes('high school');
        } else if (target_group === 'undergraduate') {
          return levelOfStudy.includes('undergraduate') || levelOfStudy.includes('bachelor') || levelOfStudy.includes('university');
        }
        return true;
      });
    }

    return data || [];
  }

  static async getUserStats(userId) {
    const userPoints = await this.getUserPoints(userId);
    const transactions = await this.getTransactionHistory(userId, 10);

    // Get assignment completion stats
    const { data: submissionStats, error: statsError } = await supabase
      .from('assignment_submissions')
      .select('status')
      .eq('user_id', userId);

    if (statsError) throw statsError;

    const stats = {
      total_points: userPoints.total_points,
      available_points: userPoints.available_points,
      points_spent: userPoints.points_spent,
      level_name: userPoints.level_name,
      assignments_completed: submissionStats?.filter(s => s.status === 'approved').length || 0,
      assignments_pending: submissionStats?.filter(s => s.status === 'pending').length || 0,
      recent_transactions: transactions
    };

    return stats;
  }

  static async getLeaderboardStats(period = null, userId = null) {
    try {
      // Get total participants
      const { count: totalParticipants, error: countError } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', 0);

      if (countError) throw countError;

      // Get average points
      const { data: avgData, error: avgError } = await supabase
        .from('user_points')
        .select('total_points');

      if (avgError) throw avgError;

      const averagePoints = avgData?.length > 0 
        ? avgData.reduce((sum, user) => sum + user.total_points, 0) / avgData.length 
        : 0;

      // Get top performer
      const { data: topPerformer, error: topError } = await supabase
        .from('user_points')
        .select(`
          total_points,
          users(name)
        `)
        .order('total_points', { ascending: false })
        .limit(1)
        .single();

      if (topError && topError.code !== 'PGRST116') throw topError;

      // Get user's rank if userId provided
      let userRank = null;
      if (userId) {
        const { data: userRankData, error: rankError } = await supabase
          .rpc('get_user_rank', { user_id: userId });

        if (!rankError) {
          userRank = userRankData;
        }
      }

      return {
        total_participants: totalParticipants || 0,
        average_points: averagePoints,
        top_performer: {
          name: topPerformer?.users?.name || 'No data',
          points: topPerformer?.total_points || 0
        },
        your_rank: userRank
      };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return {
        total_participants: 0,
        average_points: 0,
        top_performer: { name: 'No data', points: 0 },
        your_rank: null
      };
    }
  }
}

module.exports = UserPoints;