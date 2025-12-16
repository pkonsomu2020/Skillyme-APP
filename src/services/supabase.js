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
      // Get users with their session attendance and payment stats
      const { data, error } = await this.client
        .from('users')
        .select(`
          *,
          user_sessions(count),
          payments(count, amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats for each user
      const usersWithStats = data.map(user => {
        const sessionsAttended = user.user_sessions?.length || 0;
        const totalPayments = user.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const paymentsCount = user.payments?.length || 0;
        
        // Calculate points based on activity (mock calculation)
        const points = (sessionsAttended * 50) + (paymentsCount * 25) + Math.floor(totalPayments / 10);
        
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
          payments_count: paymentsCount
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

      // Sort by points and add rank
      const sortedUsers = usersResponse.data
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
          field_of_study: user.field_of_study
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