import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  adminToken: string | null;
  validateToken: () => Promise<boolean>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Checking initial auth state...');
    const auth = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('adminToken');
    
    console.log('Stored auth:', auth);
    console.log('Stored token:', token ? 'Present' : 'Missing');
    console.log('Token value:', token);
    
    if (auth === 'true' && token && token !== 'undefined' && token !== 'null' && token.length > 10) {
      console.log('AuthContext: Setting authenticated state from localStorage');
      setIsAuthenticated(true);
      setAdminToken(token);
    } else {
      console.log('AuthContext: Clearing invalid auth data');
      // Clear invalid auth data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      setAdminToken(null);
    }
    
    setIsInitialized(true);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting admin login with:', { username, password: '***' });
      
      // Clear any existing auth data before login
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      setAdminToken(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        console.log('Login successful, setting auth state...');
        console.log('Full response data:', data);
        console.log('Token received:', data.data?.token);
        
        const token = data.data?.token;
        if (!token) {
          console.error('No token found in response data');
          return false;
        }
        
        // Set state first
        setIsAuthenticated(true);
        setAdminToken(token);
        
        // Then store in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('adminToken', token);
        
        console.log('Auth state updated, isAuthenticated:', true);
        console.log('Token stored:', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminToken(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminToken');
  };

  const validateToken = async (): Promise<boolean> => {
    if (!adminToken) return false;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return true;
      } else {
        // Token is invalid, logout
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, adminToken, validateToken, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
