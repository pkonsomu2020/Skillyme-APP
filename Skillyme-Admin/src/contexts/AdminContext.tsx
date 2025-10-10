import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminApi, Admin } from '../services/api';

interface AdminContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await adminApi.auth.getProfile();
      if (response.success && response.data) {
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await adminApi.auth.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('adminToken', response.data.token);
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error('Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    try {
      const response = await adminApi.auth.getProfile();
      if (response.success && response.data) {
        setAdmin(response.data.admin);
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  };

  const value: AdminContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshProfile,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;