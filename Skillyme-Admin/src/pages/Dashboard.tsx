import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { RealTimeAnalytics } from "@/components/RealTimeAnalytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Video, 
  Calendar, 
  TrendingUp, 
  Activity,
  BarChart3,
  PieChart,
  Clock
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from "recharts"
import { adminApi } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

interface QuickStats {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}

interface TopSession {
  id: number
  title: string
  recruiter: string
  company: string
  current_attendees: number
  max_attendees: number
  revenue?: number
}

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading, admin } = useAuth()
  const [quickStats, setQuickStats] = useState<QuickStats[]>([])
  const [topSessions, setTopSessions] = useState<TopSession[]>([])
  const [userDemographics, setUserDemographics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch additional dashboard data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchAdditionalData = async () => {
      try {
        // Get session analytics for top sessions
        const sessionResponse = await adminApi.analytics.getSessionAnalytics()
        if (sessionResponse.success && sessionResponse.data) {
          setTopSessions(sessionResponse.data.topSessions || [])
          
          // Create quick stats
          const stats: QuickStats[] = [
            {
              label: "Avg. Attendees",
              value: sessionResponse.data.overview.averageAttendees?.toFixed(1) || "0",
              change: "per session",
              trend: 'neutral'
            },
            {
              label: "Completion Rate",
              value: `${Math.round((sessionResponse.data.overview.completedSessions / sessionResponse.data.overview.totalSessions) * 100) || 0}%`,
              change: "of all sessions",
              trend: 'up'
            }
          ]
          setQuickStats(stats)
        }

        // Get user demographics
        const demographicsResponse = await adminApi.analytics.getUserDemographics()
        if (demographicsResponse.success && demographicsResponse.data) {
          const fieldData = Object.entries(demographicsResponse.data.byField || {})
            .map(([field, count]) => ({
              name: field,
              value: count as number
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
          
          setUserDemographics(fieldData)
        }
      } catch (error) {
        console.error('Failed to fetch additional dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdditionalData()
  }, [isAuthenticated, authLoading])

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Authentication required</p>
            <p className="text-muted-foreground">Please log in to access this page</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Colors for pie chart
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {admin?.name || 'Admin'}! Here's what's happening on your platform.
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-green-500" />
            Live Data
          </Badge>
        </div>

        {/* Real-Time Analytics Component */}
        <RealTimeAnalytics />

        {/* Additional Insights */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Performing Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Performing Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : topSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sessions data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topSessions.slice(0, 5).map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {session.recruiter} • {session.company}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session.current_attendees || 0}/{session.max_attendees || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">attendees</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                User Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : userDemographics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No demographics data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={userDemographics}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {userDemographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Users']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {userDemographics.slice(0, 4).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {quickStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {quickStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </div>
                    <TrendingUp className={`h-6 w-6 ${
                      stat.trend === 'up' ? 'text-green-600' : 
                      stat.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Real-Time Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  All data is updated automatically every 30 seconds to give you the latest insights into your platform's performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}