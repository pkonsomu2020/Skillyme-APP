import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { adminApi, Admin } from "@/services/api"

interface AdminContextType {
  isAuthenticated: boolean
  admin: Admin | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  // Refresh admin profile
  const refreshProfile = async () => {
    try {
      const response = await adminApi.auth.getProfile()
      if (response.success && response.data?.admin) {
        setAdmin(response.data.admin)
      }
    } catch (error) {
      console.warn("Profile refresh failed:", error)
    }
  }

  useEffect(() => {
    // Check if admin is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("adminToken")
        if (token) {
          // Validate token format first
          try {
            const parts = token.split('.')
            if (parts.length === 3) {
              // Valid JWT format, set authenticated immediately
              setIsAuthenticated(true)
              
              // Try to get profile in background
              try {
                await refreshProfile()
              } catch (error) {
                console.warn("Background profile fetch failed:", error)
                // Don't logout on profile fetch failure - could be network issue
              }
            } else {
              // Invalid token format
              localStorage.removeItem("adminToken")
              setIsAuthenticated(false)
              setAdmin(null)
            }
          } catch (error) {
            // Token parsing failed
            localStorage.removeItem("adminToken")
            setIsAuthenticated(false)
            setAdmin(null)
          }
        } else {
          // No token
          setIsAuthenticated(false)
          setAdmin(null)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Enhanced login method with better error handling
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Prevent multiple simultaneous login attempts
      if (isAuthenticated) {
        console.log("✅ Already authenticated")
        return true
      }
      
      setLoading(true)
      
      console.log("🔐 Attempting admin login...")
      
      // Use the working clean login method
      const response = await adminApi.auth.login(email, password)
      
      if (response.success && response.data?.token && response.data?.admin) {
        console.log("✅ Login successful")
        localStorage.setItem("adminToken", response.data.token)
        setIsAuthenticated(true)
        setAdmin(response.data.admin)
        return true
      } else {
        console.log("❌ Login failed:", response.error || "Unknown error")
        return false
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log("🚪 Logging out admin")
    setIsAuthenticated(false)
    setAdmin(null)
    localStorage.removeItem("adminToken")
  }

  return (
    <AdminContext.Provider value={{ 
      isAuthenticated, 
      admin, 
      login, 
      logout, 
      loading,
      refreshProfile
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}