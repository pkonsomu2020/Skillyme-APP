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
      console.log('AuthContext: fetchUserProfile called');
      if (apiService.isAuthenticated()) {
        console.log('AuthContext: Token exists, fetching profile...');
        const response = await apiService.getProfile();
        if (response.success) {
          console.log('AuthContext: Profile fetched successfully:', response.data.user);
          setUser(response.data.user);
        } else {
          console.log('AuthContext: Profile fetch failed:', response);
          // Only clear user state if we don't have a user already
          if (!user) {
            setUser(null);
          }
        }
      } else {
        console.log('AuthContext: No token found');
        // Only clear user state if we don't have a user already
        if (!user) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('AuthContext: Failed to fetch user profile:', error);
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
      const response = await apiService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      console.log('AuthContext: register called with userData:', userData);
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        console.log('AuthContext: Registration successful, setting user:', response.data.user);
        // Set user data from registration response
        setUser(response.data.user);
        console.log('AuthContext: User state updated, isAuthenticated should be true');
        
        // Verify token is stored
        const token = apiService.getAuthToken();
        console.log('AuthContext: Token stored after registration:', token ? 'YES' : 'NO');
        
        // Store authentication state in localStorage for persistence
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setIsLoading(false);
        
        return true;
      }
      console.log('AuthContext: Registration failed');
      return false;
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user...');
    apiService.logout();
    setUser(null);
    // Clear all stored authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    console.log('AuthContext: User state cleared, isAuthenticated should be false');
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthState = async () => {
      console.log('AuthContext: Checking initial auth state...');
      const storedAuth = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      console.log('Stored auth:', !!storedAuth);
      console.log('Stored token:', storedAuth ? 'Present' : 'Not found');
      console.log('Stored user:', storedUser ? 'Present' : 'Not found');
      console.log('Stored isAuthenticated:', isAuthenticated);
      
      if (storedAuth && storedUser && isAuthenticated === 'true') {
        console.log('Token value:', storedAuth);
        console.log('AuthContext: Setting authenticated state from localStorage');
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('AuthContext: User restored from localStorage:', userData);
        } catch (error) {
          console.error('AuthContext: Error parsing stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        }
        setIsLoading(false);
      } else {
        console.log('AuthContext: No stored authentication data found');
        setIsLoading(false);
      }
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
