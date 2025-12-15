import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  county?: string;
  fieldOfStudy?: string;
  institution?: string;
  levelOfStudy?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const fetchUserProfile = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const response = await apiService.getProfile();
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Only clear user state if we don't have a user already
          if (!user) {
            setUser(null);
          }
        }
      } else {
        // Only clear user state if we don't have a user already
        if (!user) {
          setUser(null);
        }
      }
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      // Only clear authentication if it's a 401/403 error
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Invalid')) {
        apiService.logout();
        setUser(null);
      }
      // For other errors, keep the user state
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Starting login for', email);
      const response = await apiService.login(email, password);
      console.log('🔍 AuthContext: API response:', response);
      
      if (response.success) {
        console.log('✅ AuthContext: Login successful, setting user');
        // Set user immediately without waiting
        setUser(response.data.user);
        // Store auth state for persistence
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      } else {
        console.log('❌ AuthContext: Login failed - response.success is false');
        console.log('Response data:', response);
        return false;
      }
    } catch (error) {
      console.log('❌ AuthContext: Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success) {
        // Set user immediately
        setUser(response.data.user);
        // Store auth state for persistence
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      return false;
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Logging out user
    apiService.logout();
    setUser(null);
    // Clear all stored authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    // User state cleared
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthState = async () => {
      const storedAuth = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (storedAuth && storedUser && isAuthenticated === 'true') {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Optionally verify the token is still valid by fetching profile
          try {
            await fetchUserProfile();
          } catch (error) {
            // If profile fetch fails, the token might be expired
            console.log('Token validation failed, clearing auth state');
            apiService.logout();
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };
    
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
