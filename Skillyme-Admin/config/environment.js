// Environment configuration for Skillyme Admin Dashboard
export const environment = {
  // Backend API Configuration
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'https://skillyme-backend-s3sy.onrender.com/api',
  
  // Application Information
  appName: import.meta.env.VITE_APP_NAME || 'Skillyme Admin Dashboard',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Professional admin dashboard for Skillyme platform management',
  
  // Development/Production flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // API Configuration
  apiConfig: {
    baseURL: import.meta.env.VITE_BACKEND_URL || 'https://skillyme-backend-s3sy.onrender.com/api',
    timeout: 30000,
    retries: 3
  }
};

export default environment;
