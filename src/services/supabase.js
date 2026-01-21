import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
  console.warn('⚠️ Supabase configuration missing or invalid. Falling back to API endpoints.');
  // Create a mock client to prevent crashes
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} })
    })
  };
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } })
      }),
      channel: () => ({
        on: () => ({ subscribe: () => {} })
      })
    };
  }
}

export { supabase };

// Supabase service class for database operations
class SupabaseService {
  constructor() {
    this.client = supabase;
    this.isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined');
  }

  // Check if Supabase is properly configured
  checkConfiguration() {
    if (!this.isConfigured) {
      console.warn('⚠️ Supabase not configured, falling back to API endpoints');
      return false;
    }
    return true;
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
    if (!this.checkConfiguration()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Get users first
      const { data: users, error: usersError } = await this.client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get all user sessions - use sessions table instead of user_sessions
      const { data: userSessions, error: sessionsError } = await this.client
        .from('sessions')
        .select('id, title, company, date, time, is_active');

      if (sessionsError) {
        console.warn('Could not fetch sessions:', sessionsError);
      }

      // Get all payments
      const { data: payments, error: paymentsError } = await this.client
        .from('payments')
        .select('user_id, amount, status');

      if (paymentsError) {
        console.warn('Could not fetch payments:', paymentsError);
      }

      // Calculate stats for each user
      const usersWithStats = users.map(user => {
        // For now, use a simple calculation since we don't have user_sessions table
        const userSessionsCount = 0; // Will be updated when proper relationship is established
        
        // Calculate payment stats for this user
        const userPayments = payments ? payments.filter(p => p.user_id === user.id) : [];
        const approvedPayments = userPayments.filter(p => p.status === 'approved' || p.status === 'completed');
        const totalPayments = approvedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const paymentsCount = approvedPayments.length;
        
        // Mock assignment data (in real implementation, this would come from assignments table)
        const assignmentsCompleted = Math.min(userSessionsCount + paymentsCount, userSessionsCount * 2);
        
        // Enhanced points calculation
        const assignmentPoints = assignmentsCompleted * 75;
        const sessionPoints = userSessionsCount * 50;
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
          sessions_attended: userSessionsCount,
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
    if (!this.checkConfiguration()) {
      return { success: false, error: 'Supabase not configured' };
    }

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
      // Get sessions first
      const { data: sessions, error: sessionsError } = await this.client
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (sessionsError) throw sessionsError;

      // For now, return sessions without attendance data since user_sessions table relationship is not working
      // This will be updated when the proper relationship is established
      const sessionsWithAttendance = sessions.map(session => ({
        ...session,
        user_sessions: [] // Empty array until relationship is fixed
      }));

      return { success: true, data: sessionsWithAttendance };
    } catch (error) {
      console.error('Error fetching sessions with attendance:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment operations
  async getAllPayments() {
    try {
      // Get payments first
      const { data: payments, error: paymentsError } = await this.client
        .from('payments')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Get user details separately
      const userIds = [...new Set(payments.map(p => p.user_id))];
      const { data: users, error: usersError } = await this.client
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.warn('Could not fetch user details:', usersError);
      }

      // Get session details separately
      const sessionIds = [...new Set(payments.map(p => p.session_id).filter(Boolean))];
      const { data: sessions, error: sessionsError } = await this.client
        .from('sessions')
        .select('id, title, company')
        .in('id', sessionIds);

      if (sessionsError) {
        console.warn('Could not fetch session details:', sessionsError);
      }

      // Combine the data
      const paymentsWithDetails = payments.map(payment => ({
        ...payment,
        users: users ? users.find(user => user.id === payment.user_id) : null,
        sessions: sessions ? sessions.find(session => session.id === payment.session_id) : null
      }));

      return { success: true, data: paymentsWithDetails };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentsByStatus(status) {
    try {
      // Get payments by status first
      const { data: payments, error: paymentsError } = await this.client
        .from('payments')
        .select('*')
        .eq('status', status)
        .order('submitted_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Get user details separately
      const userIds = [...new Set(payments.map(p => p.user_id))];
      const { data: users, error: usersError } = await this.client
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.warn('Could not fetch user details:', usersError);
      }

      // Get session details separately
      const sessionIds = [...new Set(payments.map(p => p.session_id).filter(Boolean))];
      const { data: sessions, error: sessionsError } = await this.client
        .from('sessions')
        .select('id, title, company')
        .in('id', sessionIds);

      if (sessionsError) {
        console.warn('Could not fetch session details:', sessionsError);
      }

      // Combine the data
      const paymentsWithDetails = payments.map(payment => ({
        ...payment,
        users: users ? users.find(user => user.id === payment.user_id) : null,
        sessions: sessions ? sessions.find(session => session.id === payment.session_id) : null
      }));

      return { success: true, data: paymentsWithDetails };
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return { success: false, error: error.message };
    }
  }

  // User session operations
  async getUserSessions(userId) {
    try {
      // For now, return empty array since user_sessions table relationship is not working
      // This will be updated when the proper relationship is established
      return { success: true, data: [] };
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