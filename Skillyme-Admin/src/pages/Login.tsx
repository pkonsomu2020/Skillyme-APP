import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function Login() {
  const [email, setEmail] = useState("admin@skillyme.com")
  const [password, setPassword] = useState("Skillyme@2025")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'main' | 'simple' | 'ultra' | 'clean'>('main')
  const { 
    login, 
    simpleLogin, 
    ultraSimpleLogin, 
    cleanLogin, 
    isAuthenticated, 
    loading 
  } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

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

    try {
      let success = false
      
      // Try different login methods based on selection
      switch (loginMethod) {
        case 'main':
          success = await login(email, password)
          break
        case 'simple':
          success = await simpleLogin(email, password)
          break
        case 'ultra':
          success = await ultraSimpleLogin(email, password)
          break
        case 'clean':
          success = await cleanLogin(email, password)
          break
        default:
          success = await login(email, password)
      }
      
      if (success) {
        toast({
          title: "Login Successful",
          description: `Welcome to Skillyme Admin Dashboard (${loginMethod} method)`,
        })
        navigate("/dashboard")
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="text-3xl font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Skillyme Admin</CardTitle>
            <CardDescription>Sign in to manage your dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@skillyme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
              />
            </div>
            
            {/* Login Method Selection */}
            <div className="space-y-2">
              <Label>Login Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={loginMethod === 'main' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('main')}
                >
                  Main
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('simple')}
                >
                  Simple
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'ultra' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('ultra')}
                >
                  Ultra
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'clean' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('clean')}
                >
                  Clean
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : `Login (${loginMethod})`}
            </Button>
          </form>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>Default credentials:</p>
            <p>Email: admin@skillyme.com</p>
            <p>Password: Skillyme@2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}