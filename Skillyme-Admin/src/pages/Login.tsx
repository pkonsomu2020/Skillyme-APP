import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wifi, WifiOff } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [serverStatus, setServerStatus] = useState<'checking' | 'warm' | 'cold' | 'error'>('checking')
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking')
      const startTime = Date.now()
      
      const response = await fetch('https://skillyme-backend-s3sy.onrender.com/api/admin/sessions', {
        method: 'HEAD'
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        if (responseTime > 3000) {
          setServerStatus('cold')
        } else {
          setServerStatus('warm')
        }
      } else {
        setServerStatus('error')
      }
    } catch (error) {
      setServerStatus('error')
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isLoading) {
      console.log("Login already in progress, ignoring submission")
      return
    }
    
    setIsLoading(true)
    setLoadingProgress(0)

    try {
      // Enhanced loading feedback
      setLoadingMessage("Connecting to server...")
      setLoadingProgress(20)
      
      // If server is cold, warn user
      if (serverStatus === 'cold') {
        setLoadingMessage("Waking up server (this may take 10-30 seconds)...")
        toast({
          title: "Server Starting",
          description: "The server is starting up. This may take a moment on first login.",
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      setLoadingProgress(40)
      
      setLoadingMessage("Authenticating...")
      setLoadingProgress(60)
      
      console.log("🔍 DEBUG: Login page - attempting login with:", { email, password: "***" })
      const success = await login(email, password)
      console.log("🔍 DEBUG: Login page - login result:", success)
      
      setLoadingProgress(80)
      
      if (success) {
        setLoadingMessage("Loading dashboard...")
        setLoadingProgress(100)
        
        toast({
          title: "Login Successful",
          description: "Welcome to Skillyme Admin Dashboard",
        })
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500))
        navigate("/dashboard")
      } else {
        setLoadingProgress(0)
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check your credentials.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoadingProgress(0)
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
      setLoadingProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing admin dashboard...</p>
        </div>
      </div>
    )
  }

  const getServerStatusIcon = () => {
    switch (serverStatus) {
      case 'warm':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'cold':
        return <WifiOff className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
  }

  const getServerStatusMessage = () => {
    switch (serverStatus) {
      case 'warm':
        return "Server ready - fast login expected"
      case 'cold':
        return "Server starting - login may take 10-30 seconds"
      case 'error':
        return "Server connection issues detected"
      default:
        return "Checking server status..."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg ring-2 ring-primary/20 overflow-hidden">
            <img 
              src="/Skillyme LOGO.jpg" 
              alt="Skillyme Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Skillyme Admin</CardTitle>
            <CardDescription>Sign in to manage your dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Server Status Indicator */}
          <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2">
            {getServerStatusIcon()}
            <span className="text-sm text-muted-foreground">
              {getServerStatusMessage()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@skillyme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            {/* Loading Progress */}
            {isLoading && (
              <div className="space-y-2">
                <Progress value={loadingProgress} className="w-full" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingMessage || "Processing..."}
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || serverStatus === 'error'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </Button>

            {/* Performance Tips */}
            {serverStatus === 'cold' && !isLoading && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>First login tip:</strong> The server is starting up. 
                  Your first login may take 10-30 seconds, but subsequent logins will be much faster.
                </p>
              </div>
            )}

            {/* Quick Login Helper */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                🚀 <strong>Quick login:</strong> Use admin@skillyme.com with your admin password
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}