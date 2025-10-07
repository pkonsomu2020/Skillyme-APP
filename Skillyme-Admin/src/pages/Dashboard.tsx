import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { StatCard } from "@/components/StatCard"
import { Users, Video, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { adminApi, DashboardStats } from "@/services/api"
import ConnectionTest from "@/components/ConnectionTest"

export default function Dashboard() {
  // Stats will be loaded from backend
  const [stats, setStats] = useState([
    { title: "Total Users", value: "Loading...", icon: Users },
    { title: "Active Sessions", value: "Loading...", icon: Video },
    { title: "Total Revenue", value: "Loading...", icon: DollarSign },
    { title: "Growth Rate", value: "Loading...", icon: TrendingUp },
  ])

  // Chart data will be loaded from backend
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load dashboard stats
        const statsResponse = await adminApi.analytics.getDashboardStats()
        if (statsResponse.success && statsResponse.data) {
          const overview = statsResponse.data.overview
          setStats([
            { title: "Total Users", value: overview.totalUsers.toLocaleString(), icon: Users },
            { title: "Active Sessions", value: overview.activeSessions.toString(), icon: Video },
            { title: "Total Revenue", value: `KES ${overview.totalRevenue.toLocaleString()}`, icon: DollarSign },
            { title: "Growth Rate", value: `${overview.growthRate > 0 ? '+' : ''}${overview.growthRate.toFixed(1)}%`, icon: TrendingUp },
          ])
        }

        // Load signup trends for chart
        const trendsResponse = await adminApi.analytics.getSignupTrends()
        if (trendsResponse.success && trendsResponse.data) {
          setChartData(trendsResponse.data)
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Connection Test Component */}
        <ConnectionTest />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Signups</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No chart data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-muted-foreground">
                  <p>Recent activity will be loaded from backend</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
