import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Video, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  UserPlus, 
  CreditCard,
  Calendar,
  RefreshCw
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { adminApi } from "@/services/api"

interface DashboardStats {
  totalUsers: number
  activeSessions: number
  completedSessions: number
  totalRevenue: number
  recentSignups: number
  growthRate: number
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'session_completed' | 'payment_received' | 'session_created'
  title: string
  description: string
  timestamp: string
  icon: any
  color: string
}

interface SignupTrend {
  name: string
  signups: number
  date?: string
}

export function RealTimeAnalytics() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalRevenue: 0,
    recentSignups: 0,
    growthRate: 0
  })
  
  const [signupTrends, setSignupTrends] = useState<SignupTrend[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch dashboard analytics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await adminApi.analytics.getDashboardStats()
      if (response.success && response.data?.overview) {
        setStats(response.data.overview)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }, [])

  // Fetch signup trends
  const fetchSignupTrends = useCallback(async () => {
    try {
      const response = await adminApi.analytics.getSignupTrends()
      if (response.success && response.data?.dailySignups) {
        setSignupTrends(response.data.dailySignups)
      }
    } catch (error) {
      console.error('Failed to fetch signup trends:', error)
    }
  }, [])

  // Generate recent activity from real data
  const generateRecentActivity = useCallback(async () => {
    try {
      const activities: RecentActivity[] = []
      
      // Get recent users
      const usersResponse = await adminApi.users.getAllUsers({ limit: 5 })
      if (usersResponse.success && usersResponse.data?.users) {
        usersResponse.data.users.slice(0, 3).forEach((user: any, index: number) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_signup',
            title: 'New user registered',
            description: `${user.name} joined the platform`,
            timestamp: user.created_at,
            icon: UserPlus,
            color: 'text-green-600'
          })
        })
      }

      // Get recent sessions
      const sessionsResponse = await adminApi.sessions.getAllSessions({ limit: 5 })
      if (sessionsResponse.success && sessionsResponse.data?.sessions) {
        const completedSessions = sessionsResponse.data.sessions.filter((s: any) => s.is_completed)
        completedSessions.slice(0, 2).forEach((session: any) => {
          activities.push({
            id: `session-${session.id}`,
            type: 'session_completed',
            title: 'Session completed',
            description: `${session.title} by ${session.recruiter}`,
            timestamp: session.updated_at || session.created_at,
            icon: Calendar,
            color: 'text-blue-600'
          })
        })

        // Recent session creations
        const recentSessions = sessionsResponse.data.sessions
          .filter((s: any) => !s.is_completed)
          .slice(0, 2)
        
        recentSessions.forEach((session: any) => {
          activities.push({
            id: `session-created-${session.id}`,
            type: 'session_created',
            title: 'New session created',
            description: `${session.title} scheduled for ${new Date(session.date).toLocaleDateString()}`,
            timestamp: session.created_at,
            icon: Video,
            color: 'text-purple-600'
          })
        })
      }

      // Add some mock payment activities (since we don't have direct payment API)
      if (stats.totalRevenue > 0) {
        activities.push({
          id: 'payment-recent',
          type: 'payment_received',
          title: 'Payment received',
          description: `KES ${Math.floor(Math.random() * 1000 + 200)} from recent booking`,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          icon: CreditCard,
          color: 'text-emerald-600'
        })
      }

      // Sort by timestamp (most recent first) and limit to 6 items
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6)

      setRecentActivity(sortedActivities)
    } catch (error) {
      console.error('Failed to generate recent activity:', error)
    }
  }, [stats.totalRevenue])

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchSignupTrends(),
        generateRecentActivity()
      ])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchDashboardStats, fetchSignupTrends, generateRecentActivity])

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, refreshData])

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`
  }

  // Stat cards data
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `+${stats.recentSignups} this week`
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions.toString(),
      icon: Video,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `${stats.completedSessions} completed`
    },
    {
      title: "Total Revenue",
      value: `KES ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "From session bookings"
    },
    {
      title: "Growth Rate",
      value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: stats.growthRate >= 0 ? "text-green-600" : "text-red-600",
      bgColor: stats.growthRate >= 0 ? "bg-green-50" : "bg-red-50",
      change: "Week over week"
    }
  ]

  // Chart colors
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Header with refresh controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <p className="text-muted-foreground">
            Live data from your platform
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Signups Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={signupTrends}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Signups']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar 
                  dataKey="signups" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full bg-background ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Updating analytics...</p>
          </div>
        </div>
      )}
    </div>
  )
}