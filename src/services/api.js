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
        throw new Error(data.message || 'Request failed');
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
    this.removeAuthToken();
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

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }
}

export default new ApiService();
