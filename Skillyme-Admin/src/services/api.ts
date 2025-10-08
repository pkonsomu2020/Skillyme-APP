// Admin API Service for Backend Communication
import environment from '../../config/environment.js';

const API_BASE_URL = environment.apiConfig.baseURL;

// SECURITY: Validate API URL
if (!API_BASE_URL.startsWith('https://')) {
  console.error('❌ CRITICAL: API_BASE_URL must use HTTPS in production!');
}

// Log environment info in development
if (environment.isDevelopment) {
  console.log('🔧 Admin Dashboard Environment:', {
    backendUrl: API_BASE_URL,
    appName: environment.appName,
    version: environment.appVersion
  });
}

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
}

export interface Session {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  google_meet_link?: string;
  recruiter: string;
  company: string;
  price: number;
  max_attendees?: number;
  poster_url?: string;
  thumbnail_url?: string;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  county?: string;
  field_of_study: string;
  institution: string;
  level_of_study: string;
  preferred_name?: string;
  date_of_birth?: string;
  course_of_study?: string;
  degree?: string;
  year_of_study?: string;
  primary_field_interest?: string;
  signup_source?: string;
  // is_active: boolean; // Field doesn't exist in database
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalRevenue: number;
  growthRate: number;
}

export interface Notification {
  id: number;
  type: string;
  subject: string;
  message: string;
  recipients: string;
  target_count: number;
  successful_sends: number;
  failed_sends: number;
  sent_by: number;
  created_at: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      // Enhanced error logging for debugging
      console.error(`❌ API Error: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        data: data,
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
      
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Admin Authentication API
export const adminAuthApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; admin: Admin }>> => {
    return apiRequest('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getProfile: async (): Promise<ApiResponse<{ admin: Admin }>> => {
    return apiRequest('/admin/auth/profile');
  },

  updateProfile: async (updates: Partial<Admin>): Promise<ApiResponse<{ admin: Admin }>> => {
    return apiRequest('/admin/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Dashboard Analytics API
export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<{ overview: DashboardStats }>> => {
    return apiRequest('/admin/analytics/dashboard');
  },

  getSignupTrends: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/admin/analytics/signup-trends');
  },

  getSessionPerformance: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/admin/analytics/session-performance');
  },

  getUserDemographics: async (): Promise<ApiResponse<{ fieldOfStudy: any[]; signupSource: any[] }>> => {
    return apiRequest('/admin/analytics/user-demographics');
  },
};

// Sessions Management API
export const sessionsApi = {
  getAllSessions: async (params?: {
    search?: string;
    status?: string;
    recruiter?: string;
    company?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ sessions: Session[]; count: number }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin/sessions${queryString ? `?${queryString}` : ''}`);
  },

  getSessionById: async (id: number): Promise<ApiResponse<Session>> => {
    return apiRequest(`/admin/sessions/${id}`);
  },

  createSession: async (sessionData: Partial<Session>): Promise<ApiResponse<Session>> => {
    return apiRequest('/admin/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  updateSession: async (id: number, updates: Partial<Session>): Promise<ApiResponse<Session>> => {
    return apiRequest(`/admin/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteSession: async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest(`/admin/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  markSessionCompleted: async (id: number): Promise<ApiResponse<Session>> => {
    return apiRequest(`/admin/sessions/${id}/complete`, {
      method: 'PUT',
    });
  },

  toggleSessionActive: async (id: number, isActive: boolean): Promise<ApiResponse<Session>> => {
    return apiRequest(`/admin/sessions/${id}/toggle-active`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getSessionAttendees: async (id: number): Promise<ApiResponse<any[]>> => {
    return apiRequest(`/admin/sessions/${id}/attendees`);
  },
};

// Users Management API
export const usersApi = {
  getAllUsers: async (params?: {
    search?: string;
    field_of_study?: string;
    institution?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ users: User[]; count: number }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    return apiRequest(`/admin/users/${id}`);
  },

  toggleUserStatus: async (id: number, isActive: boolean): Promise<ApiResponse<User>> => {
    return apiRequest(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getUserFilterOptions: async (): Promise<ApiResponse<{ field_of_study: string[]; institution: string[] }>> => {
    return apiRequest('/admin/users/filter-options');
  },
};

// Notifications API
export const notificationsApi = {
  sendNotification: async (notificationData: {
    type: string;
    subject: string;
    message: string;
    recipients: string;
    sessionId?: number;
    fieldOfStudy?: string;
  }): Promise<ApiResponse<{ successfulSends: number; failedSends: number }>> => {
    return apiRequest('/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  getNotificationHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ notifications: Notification[]; count: number }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin/notifications/history${queryString ? `?${queryString}` : ''}`);
  },
};

// File Upload API
export const uploadApi = {
  uploadSessionPoster: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('session_poster', file);
    
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload/session-poster`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  uploadSessionThumbnail: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('session_thumbnail', file);
    
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload/session-thumbnail`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },
};

// Export all APIs
export const adminApi = {
  auth: adminAuthApi,
  analytics: analyticsApi,
  sessions: sessionsApi,
  users: usersApi,
  notifications: notificationsApi,
  upload: uploadApi,
};
