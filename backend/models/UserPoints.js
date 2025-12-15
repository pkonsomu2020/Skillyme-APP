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

  static async getLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from('user_points')
      .select(`
        *,
        users(name, email)
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;
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
}

module.exports = UserPoints;