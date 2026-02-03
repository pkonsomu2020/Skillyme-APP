const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://skillyme-backend-s3sy.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('authToken');
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    // PERFORMANCE: Removed excessive logging and CSRF overhead

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // PERFORMANCE: Removed excessive error logging
      if (!response.ok) {
        // Provide detailed error message from backend
        const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        
        // Include validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          error.validationErrors = data.errors;
          error.message = data.errors.map(err => err.msg || err.message).join(', ');
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async login(email, password) {
    console.log('🔍 API Service: Login request for', email);
    console.log('🔍 API Service: Base URL:', this.baseURL);
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('🔍 API Service: Response received:', response);

    if (response.success && response.data.token) {
      console.log('✅ API Service: Setting auth token');
      this.setAuthToken(response.data.token);
    } else {
      console.log('❌ API Service: No token in response or success is false');
    }

    return response;
  }

  async logout() {
    try {
      // Try to call logout endpoint if available
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore logout endpoint errors, just clear local token
      console.warn('Logout endpoint failed, clearing local token:', error.message);
    } finally {
      // Always clear the token regardless of endpoint success
      this.removeAuthToken();
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Payment methods
  async submitMpesaCode(sessionId, fullMpesaMessage, amount) {
    return this.request('/payments/submit-mpesa', {
      method: 'POST',
      body: JSON.stringify({ sessionId, fullMpesaMessage, amount }),
    });
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getUserSessions() {
    return this.request('/dashboard/sessions');
  }

  // Sessions methods
  async getAllSessions() {
    return this.request('/sessions');
  }

  async getSessionById(id) {
    return this.request(`/sessions/${id}`);
  }

  // Password reset methods
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateResetToken(token) {
    return this.request(`/auth/validate-reset-token/${token}`);
  }

  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Get CSRF token
  async getCSRFToken() {
    const response = await fetch(`${this.baseURL}/csrf-token`);
    const data = await response.json();
    return data.csrfToken;
  }

  // Assignment methods
  async getAssignments(sessionId = null) {
    const endpoint = sessionId ? `/assignments?session_id=${sessionId}` : '/assignments';
    return this.request(endpoint);
  }

  async getAssignmentById(id) {
    return this.request(`/assignments/${id}`);
  }

  async submitAssignment(assignmentId, submissionData) {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getUserSubmissions(status = null) {
    const endpoint = status ? `/assignments/user/submissions?status=${status}` : '/assignments/user/submissions';
    return this.request(endpoint);
  }

  async getLeaderboard(limit = 10, period = null) {
    try {
      const supabaseService = (await import('./supabase.js')).default;
      const response = await supabaseService.getLeaderboard(limit, period);
      if (response.success) {
        return response;
      }
    } catch (error) {
      console.warn('Supabase leaderboard failed, falling back to API:', error);
    }

    // Fallback to original API
    const params = new URLSearchParams({ limit: limit.toString() });
    if (period) params.append('period', period);
    return this.request(`/assignments/leaderboard?${params.toString()}`);
  }

  // New Supabase-integrated methods
  async getAllUsersFromSupabase() {
    try {
      const supabaseService = (await import('./supabase.js')).default;
      return await supabaseService.getAllUsers();
    } catch (error) {
      console.error('Error fetching users from Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  async getUsersWithStatsFromSupabase() {
    try {
      const supabaseService = (await import('./supabase.js')).default;
      return await supabaseService.getUsersWithStats();
    } catch (error) {
      console.error('Error fetching users with stats from Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  // Get ALL users with stats (for admin - shows everyone including inactive)
  async getAllUsersWithStatsFromSupabase() {
    try {
      const supabaseService = (await import('./supabase.js')).default;
      return await supabaseService.getAllUsersWithStats();
    } catch (error) {
      console.error('Error fetching all users with stats from Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  async getDashboardStatsFromSupabase(userId = null) {
    try {
      const supabaseService = (await import('./supabase.js')).default;
      return await supabaseService.getDashboardStats(userId);
    } catch (error) {
      console.error('Error fetching dashboard stats from Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Session access methods
  async checkSessionAccess(sessionId) {
    return this.request(`/session-access/session/${sessionId}`);
  }

  async getMySessionAccess() {
    return this.request('/session-access/my-access');
  }

  // Session join methods
  async joinSession(sessionId) {
    return this.request(`/sessions/${sessionId}/join`, {
      method: 'POST'
    });
  }

  // User discounts and points methods
  async getUserDiscounts() {
    return this.request('/user/discounts');
  }

  async getUserPoints() {
    return this.request('/user/points');
  }
}

export default new ApiService();
