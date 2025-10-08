import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { adminApi, Admin } from "@/services/api"

interface AuthContextType {
  isAuthenticated: boolean
  admin: Admin | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("adminToken")
        if (token) {
          // Set authenticated state immediately to avoid multiple API calls
          setIsAuthenticated(true)
          // Verify token with backend in background
          try {
            const response = await adminApi.auth.getProfile()
            if (response.success && response.data?.admin) {
              setAdmin(response.data.admin)
            } else {
              // Invalid token, clear everything
              localStorage.removeItem("adminToken")
              setIsAuthenticated(false)
              setAdmin(null)
            }
          } catch (error) {
            console.error("Token verification failed:", error)
            localStorage.removeItem("adminToken")
            setIsAuthenticated(false)
            setAdmin(null)
          }
        } else {
          // No token, ensure clean state
          setIsAuthenticated(false)
          setAdmin(null)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("adminToken")
        setIsAuthenticated(false)
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Clean login method (using the working clean authentication)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Prevent multiple simultaneous login attempts
      if (isAuthenticated) {
        console.log("Already authenticated, skipping login")
        return true
      }
      
      // Use clean login which is working perfectly
      const response = await adminApi.auth.cleanLogin(email, password)
      
      if (response.success && response.data?.token) {
        localStorage.setItem("adminToken", response.data.token)
        setIsAuthenticated(true)
        setAdmin(response.data.admin)
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAdmin(null)
    localStorage.removeItem("adminToken")
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      admin, 
      login, 
      logout, 
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}