// Admin API Service for Backend Communication
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import environment from '../../config/environment';

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
  description?: string;
  date: string;
  time: string;
  google_meet_link?: string;
  recruiter: string;
  company: string;
  price: number;
  paybill_number?: string;
  business_number?: string;
  is_active: boolean;
  is_completed: boolean;
  max_attendees?: number;
  current_attendees?: number;
  poster_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  county: string | null;
  field_of_study: string;
  institution: string;
  level_of_study: string;
  created_at: string;
  updated_at: string;
  password: string;
  preferred_name: string | null;
  date_of_birth: string | null;
  course_of_study: string | null;
  degree: string | null;
  year_of_study: string | null;
  primary_field_interest: string | null;
  signup_source: string | null;
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

export interface Booking {
  id: number;
  user_id: number;
  session_id: number;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  amount_paid?: number;
  booking_date: string;
  created_at: string;
  updated_at: string;
  users: {
    id: number;
    name: string;
    email: string;
    phone: string;
    field_of_study: string;
    institution: string;
  };
  sessions: {
    id: number;
    title: string;
    company: string;
    recruiter: string;
    datetime: string;
    price: number;
    description?: string;
    google_meet_link?: string;
  };
}

export interface BookingStats {
  totalBookings: number;
  recentBookings: number;
  bookingStatusCounts: Record<string, number>;
  paymentStatusCounts: Record<string, number>;
  totalRevenue: number;
  averageBookingValue: number;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Helper function to validate token (simplified since tokens never expire)
const validateToken = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  // Since we removed JWT expiration, just check if token exists and is valid format
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Try to parse the payload to ensure it's a valid JWT
    JSON.parse(atob(parts[1]));
    return true;
  } catch (error: unknown) {
    console.warn('🔐 Invalid token format, removing from storage');
    localStorage.removeItem('adminToken');
    return false;
  }
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<ApiResponse<T>> => {
  // Only validate token if authentication is required (skip for login endpoints)
  if (requireAuth && !validateToken()) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && requireAuth && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        console.warn('🔐 Token expired or invalid, redirecting to login...');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return {
          success: false,
          error: 'Authentication required'
        };
      }

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
  } catch (error: unknown) {
    console.error('❌ API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Admin Authentication API
export const adminAuthApi = {
  // Clean authentication method
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; admin: Admin }>> => {
    return await apiRequest<{ token: string; admin: Admin }>('/admin/auth/clean-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false); // Don't require auth for login
  },

  getProfile: async (): Promise<ApiResponse<{ admin: Admin }>> => {
    return apiRequest<{ admin: Admin }>('/admin/auth/profile');
  },

  updateProfile: async (updates: Partial<Admin>): Promise<ApiResponse<{ admin: Admin }>> => {
    return apiRequest<{ admin: Admin }>('/admin/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Clean login method (alias for consistency)
  cleanLogin: async (email: string, password: string): Promise<ApiResponse<{ token: string; admin: Admin }>> => {
    return apiRequest<{ token: string; admin: Admin }>('/admin/auth/clean-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false); // Don't require auth for login
  },
};

// Dashboard Analytics API
export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<{ overview: DashboardStats }>> => {
    return apiRequest<{ overview: DashboardStats }>('/admin/analytics/dashboard');
  },

  getSignupTrends: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/analytics/signup-trends');
  },

  getSessionPerformance: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/analytics/session-performance');
  },

  getUserDemographics: async (): Promise<ApiResponse<{ fieldOfStudy: any[]; signupSource: any[] }>> => {
    return apiRequest<{ fieldOfStudy: any[]; signupSource: any[] }>('/admin/analytics/user-demographics');
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
    return apiRequest<{ sessions: Session[]; count: number }>(`/admin/sessions${queryString ? `?${queryString}` : ''}`);
  },

  getSessionById: async (id: number): Promise<ApiResponse<Session>> => {
    return apiRequest<Session>(`/admin/sessions/${id}`);
  },

  createSession: async (sessionData: Partial<Session>): Promise<ApiResponse<Session>> => {
    return apiRequest<Session>('/admin/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  updateSession: async (id: number, updates: Partial<Session>): Promise<ApiResponse<Session>> => {
    return apiRequest<Session>(`/admin/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteSession: async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/admin/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  markSessionCompleted: async (id: number): Promise<ApiResponse<Session>> => {
    return apiRequest<Session>(`/admin/sessions/${id}/complete`, {
      method: 'PUT',
    });
  },

  toggleSessionActive: async (id: number, isActive: boolean): Promise<ApiResponse<Session>> => {
    return apiRequest<Session>(`/admin/sessions/${id}/toggle-active`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getSessionAttendees: async (id: number): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>(`/admin/sessions/${id}/attendees`);
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
    return apiRequest<{ users: User[]; count: number }>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    return apiRequest<User>(`/admin/users/${id}`);
  },

  toggleUserStatus: async (id: number, isActive: boolean): Promise<ApiResponse<User>> => {
    return apiRequest<User>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getUserFilterOptions: async (): Promise<ApiResponse<{ field_of_study: string[]; institution: string[] }>> => {
    return apiRequest<{ field_of_study: string[]; institution: string[] }>('/admin/users/filter-options');
  },

  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  cleanupTestUsers: async (): Promise<ApiResponse<{ deletedCount: number; deletedUsers: any[]; remainingCount: number }>> => {
    return apiRequest<{ deletedCount: number; deletedUsers: any[]; remainingCount: number }>('/admin/users/cleanup', {
      method: 'POST',
    });
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
    institution?: string;
  }): Promise<ApiResponse<{ totalRecipients: number; successful: number; failed: number }>> => {
    // Map frontend camelCase to backend snake_case
    const backendData = {
      type: notificationData.type,
      subject: notificationData.subject,
      message: notificationData.message,
      recipients: notificationData.recipients,
      session_id: notificationData.sessionId,
      field_of_study: notificationData.fieldOfStudy,
      institution: notificationData.institution,
    };

    return apiRequest<{ totalRecipients: number; successful: number; failed: number }>('/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(backendData),
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
    return apiRequest<{ notifications: Notification[]; count: number }>(`/admin/notifications/history${queryString ? `?${queryString}` : ''}`);
  },

  getRecipientOptions: async (): Promise<ApiResponse<{ fieldsOfStudy: string[]; institutions: string[] }>> => {
    return apiRequest<{ fieldsOfStudy: string[]; institutions: string[] }>('/admin/notifications/recipient-options');
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },
};

// Bookings Management API
export const bookingsApi = {
  getAllBookings: async (params?: {
    search?: string;
    booking_status?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; pages: number } }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    return apiRequest<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/bookings${queryString ? `?${queryString}` : ''}`);
  },

  updateBookingStatus: async (id: number, updates: {
    booking_status?: string;
    payment_status?: string;
    notes?: string;
  }): Promise<ApiResponse<Booking>> => {
    return apiRequest<Booking>(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getBookingStats: async (): Promise<ApiResponse<BookingStats>> => {
    return apiRequest<BookingStats>('/admin/bookings/stats');
  },

  sendBookingReminder: async (id: number, message?: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/admin/bookings/${id}/reminder`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

// Export all APIs
export const adminApi = {
  auth: adminAuthApi,
  analytics: analyticsApi,
  sessions: sessionsApi,
  users: usersApi,
  notifications: notificationsApi,
  bookings: bookingsApi,
  upload: uploadApi,
};
