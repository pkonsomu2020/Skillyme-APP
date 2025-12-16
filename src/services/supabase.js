import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase service class for database operations
class SupabaseService {
  constructor() {
    this.client = supabase;
  }

  // User operations
  async getAllUsers() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  }

  // Get ALL users with stats (for admin dashboard - shows everyone)
  async getAllUsersWithStats() {
    try {
      const usersResponse = await this.getUsersWithStats();
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Return ALL users with their stats (no filtering)
      const allUsers = usersResponse.data.map((user, index) => ({
        ...user,
        rank: index + 1 // Rank all users by points
      }));

      return { success: true, data: allUsers };
    } catch (error) {
      console.error('Error fetching all users with stats:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserById(id) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUsersWithStats() {
    try {
      // Get users with their session attendance, payment stats, and assignment submissions
      const { data, error } = await this.client
        .from('users')
        .select(`
          *,
          user_sessions(count),
          payments(count, amount, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats for each user
      const usersWithStats = data.map(user => {
        const sessionsAttended = user.user_sessions?.length || 0;
        const allPayments = user.payments || [];
        const approvedPayments = allPayments.filter(p => p.status === 'approved' || p.status === 'completed');
        const totalPayments = approvedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const paymentsCount = approvedPayments.length;
        
        // Mock assignment data (in real implementation, this would come from assignments table)
        // For now, we'll use a combination of sessions and payments as proxy for assignments
        const assignmentsCompleted = Math.min(sessionsAttended + paymentsCount, sessionsAttended * 2);
        
        // Enhanced points calculation
        const assignmentPoints = assignmentsCompleted * 75; // Higher points for assignments
        const sessionPoints = sessionsAttended * 50;
        const paymentPoints = paymentsCount * 25;
        const bonusPoints = Math.floor(totalPayments / 10);
        
        const points = assignmentPoints + sessionPoints + paymentPoints + bonusPoints;
        
        // Determine level based on points
        let level = 'Beginner';
        if (points >= 1000) level = 'Expert';
        else if (points >= 500) level = 'Advanced';
        else if (points >= 250) level = 'Intermediate';
        else if (points >= 100) level = 'Explorer';

        return {
          ...user,
          total_points: points,
          level_name: level,
          sessions_attended: sessionsAttended,
          total_payments: totalPayments,
          payments_count: paymentsCount,
          assignments_completed: assignmentsCompleted
        };
      });

      return { success: true, data: usersWithStats };
    } catch (error) {
      console.error('Error fetching users with stats:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const usersResponse = await this.getUsersWithStats();
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Filter users who have activity (assignments, sessions, or payments)
      // Only show users who have submitted assignments OR attended sessions OR made payments
      const activeUsers = usersResponse.data.filter(user => {
        const hasAssignments = user.assignments_completed > 0;
        const hasSessions = user.sessions_attended > 0;
        const hasPayments = user.payments_count > 0;
        const hasPoints = user.total_points > 0;
        
        // Show users who have any meaningful activity
        return hasAssignments || hasSessions || hasPayments || hasPoints;
      });

      // Sort by points and add rank
      const sortedUsers = activeUsers
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
        .map((user, index) => ({
          user_id: user.id,
          name: user.name,
          total_points: user.total_points,
          level_name: user.level_name,
          rank: index + 1,
          email: user.email,
          country: user.country,
          field_of_study: user.field_of_study,
          assignments_completed: user.assignments_completed || 0,
          sessions_attended: user.sessions_attended || 0,
          payments_count: user.payments_count || 0
        }));

      return { success: true, data: { leaderboard: sortedUsers } };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  // Session operations
  async getAllSessions() {
    try {
      const { data, error } = await this.client
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return { success: false, error: error.message };
    }
  }

  async getSessionsWithAttendance() {
    try {
      const { data, error } = await this.client
        .from('sessions')
        .select(`
          *,
          user_sessions(
            user_id,
            users(name, email)
          )
        `)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching sessions with attendance:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment operations
  async getAllPayments() {
    try {
      const { data, error } = await this.client
        .from('payments')
        .select(`
          *,
          users(name, email),
          sessions(title, company)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentsByStatus(status) {
    try {
      const { data, error } = await this.client
        .from('payments')
        .select(`
          *,
          users(name, email),
          sessions(title, company)
        `)
        .eq('status', status)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return { success: false, error: error.message };
    }
  }

  // User session operations
  async getUserSessions(userId) {
    try {
      const { data, error } = await this.client
        .from('user_sessions')
        .select(`
          *,
          sessions(*)
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return { success: false, error: error.message };
    }
  }

  // Dashboard stats
  async getDashboardStats(userId = null) {
    try {
      let stats = {
        totalUsers: 0,
        totalSessions: 0,
        totalPayments: 0,
        totalRevenue: 0
      };

      if (userId) {
        // Get stats for specific user
        const userSessionsResponse = await this.getUserSessions(userId);
        const userPaymentsResponse = await this.client
          .from('payments')
          .select('*')
          .eq('user_id', userId);

        stats = {
          sessionsAttended: userSessionsResponse.data?.length || 0,
          totalPayments: userPaymentsResponse.data?.length || 0,
          totalSpent: userPaymentsResponse.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          pointsEarned: (userSessionsResponse.data?.length || 0) * 50 + (userPaymentsResponse.data?.length || 0) * 25
        };
      } else {
        // Get overall platform stats
        const [usersCount, sessionsCount, paymentsData] = await Promise.all([
          this.client.from('users').select('id', { count: 'exact' }),
          this.client.from('sessions').select('id', { count: 'exact' }),
          this.client.from('payments').select('amount')
        ]);

        stats = {
          totalUsers: usersCount.count || 0,
          totalSessions: sessionsCount.count || 0,
          totalPayments: paymentsData.data?.length || 0,
          totalRevenue: paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        };
      }

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  subscribeToUsers(callback) {
    return this.client
      .channel('users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, callback)
      .subscribe();
  }

  subscribeToPayments(callback) {
    return this.client
      .channel('payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback)
      .subscribe();
  }

  subscribeToSessions(callback) {
    return this.client
      .channel('sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, callback)
      .subscribe();
  }
}

export default new SupabaseService();