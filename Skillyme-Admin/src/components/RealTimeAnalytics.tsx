import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, Video, DollarSign, TrendingUp, Activity, Clock,
  UserPlus, CreditCard, Calendar, RefreshCw, FileText,
  Trophy, Gift, CheckCircle, AlertCircle, BarChart3
} from "lucide-react"
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts"
import { adminApi } from "@/services/api"
import { formatDate, formatTime } from "@/lib/dateUtils"

const REFRESH_INTERVAL = 30_000 // 30 seconds
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

interface Stats {
  totalUsers: number
  activeSessions: number
  completedSessions: number
  totalRevenue: number
  recentSignups: number
  growthRate: number
  totalAssignments: number
  pendingSubmissions: number
  approvedSubmissions: number
  activeDiscounts: number
  topLeaderPoints: number
  totalPayments: number
}

interface SignupTrend { name: string; signups: number }
interface DemoItem { name: string; value: number }
interface Activity {
  id: string
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const fmt = (v: unknown): string => {
  if (!v) return 'N/A'
  try {
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? String(v) : formatDate(d)
  } catch { return String(v) }
}

const timeAgo = (ts: string) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export function RealTimeAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeSessions: 0, completedSessions: 0,
    totalRevenue: 0, recentSignups: 0, growthRate: 0,
    totalAssignments: 0, pendingSubmissions: 0, approvedSubmissions: 0,
    activeDiscounts: 0, topLeaderPoints: 0, totalPayments: 0
  })
  const [signupTrends, setSignupTrends] = useState<SignupTrend[]>([])
  const [demographics, setDemographics] = useState<DemoItem[]>([])
  const [revenueBySession, setRevenueBySession] = useState<any[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)

    try {
      const [dashRes, trendsRes, demoRes, sessionRes, assignRes, discountRes, leaderRes] =
        await Promise.allSettled([
          adminApi.analytics.getDashboardStats(),
          adminApi.analytics.getSignupTrends(),
          adminApi.analytics.getUserDemographics(),
          adminApi.analytics.getSessionAnalytics(),
          adminApi.assignments.getAllAssignments(),
          adminApi.discounts.getAll({ limit: 500, page: 1 }),
          adminApi.discounts.getLeaderboard({ limit: 1 }),
        ])

      // ── Core stats ──────────────────────────────────────────────
      const dash = dashRes.status === 'fulfilled' && dashRes.value.success
        ? dashRes.value.data?.overview : null

      // ── Signup trends ────────────────────────────────────────────
      if (trendsRes.status === 'fulfilled' && trendsRes.value.success) {
        setSignupTrends(trendsRes.value.data?.dailySignups ?? [])
      }

      // ── Demographics ─────────────────────────────────────────────
      if (demoRes.status === 'fulfilled' && demoRes.value.success) {
        const raw = demoRes.value.data?.byField ?? {}
        const items: DemoItem[] = Object.entries(raw)
          .map(([name, value]) => ({ name, value: value as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
        setDemographics(items)
      }

      // ── Session analytics + revenue chart ────────────────────────
      let sessionOverview: any = null
      if (sessionRes.status === 'fulfilled' && sessionRes.value.success) {
        sessionOverview = sessionRes.value.data?.overview
        const topRev: any[] = sessionRes.value.data?.topRevenueSessions ?? []
        setRevenueBySession(
          topRev.slice(0, 5).map(s => ({
            name: s.title?.length > 18 ? s.title.slice(0, 18) + '…' : s.title,
            revenue: s.revenue ?? 0,
            attendees: s.attendees ?? 0
          }))
        )
      }

      // ── Assignments ───────────────────────────────────────────────
      let totalAssignments = 0, pendingSubmissions = 0, approvedSubmissions = 0
      if (assignRes.status === 'fulfilled' && assignRes.value.success) {
        totalAssignments = (assignRes.value.data?.assignments ?? []).length
      }
      // Get submission counts from assignments API
      try {
        const subRes = await adminApi.assignments.getAllSubmissions?.({ limit: 1000 })
        if (subRes?.success) {
          const subs = subRes.data?.submissions ?? []
          pendingSubmissions = subs.filter((s: any) => s.status === 'pending').length
          approvedSubmissions = subs.filter((s: any) => s.status === 'approved').length
        }
      } catch { /* submissions endpoint optional */ }

      // ── Discounts ─────────────────────────────────────────────────
      let activeDiscounts = 0
      if (discountRes.status === 'fulfilled' && discountRes.value.success) {
        const all = discountRes.value.data?.discounts ?? []
        activeDiscounts = all.filter((d: any) => d.status === 'active').length
      }

      // ── Leaderboard top points ────────────────────────────────────
      let topLeaderPoints = 0
      if (leaderRes.status === 'fulfilled' && leaderRes.value.success) {
        topLeaderPoints = leaderRes.value.data?.leaderboard?.[0]?.total_points ?? 0
      }

      setStats({
        totalUsers: dash?.totalUsers ?? 0,
        activeSessions: dash?.activeSessions ?? sessionOverview?.activeSessions ?? 0,
        completedSessions: dash?.completedSessions ?? sessionOverview?.completedSessions ?? 0,
        totalRevenue: dash?.totalRevenue ?? 0,
        recentSignups: dash?.recentSignups ?? 0,
        growthRate: dash?.growthRate ?? 0,
        totalAssignments,
        pendingSubmissions,
        approvedSubmissions,
        activeDiscounts,
        topLeaderPoints,
        totalPayments: dash?.totalPayments ?? 0,
      })

      // ── Recent activity feed ──────────────────────────────────────
      const feed: Activity[] = []
      try {
        const usersRes = await adminApi.users.getAllUsers({ limit: 5 })
        if (usersRes.success) {
          ;(usersRes.data?.users ?? []).slice(0, 3).forEach((u: any) => {
            feed.push({
              id: `u-${u.id}`,
              title: 'New user registered',
              description: `${u.name} joined the platform`,
              timestamp: u.created_at,
              icon: UserPlus,
              color: 'text-green-600'
            })
          })
        }
      } catch { /* ignore */ }

      try {
        const sessRes = await adminApi.sessions.getAllSessions({ limit: 10 })
        if (sessRes.success) {
          const sessions = sessRes.data?.sessions ?? []
          sessions.filter((s: any) => s.is_completed).slice(0, 2).forEach((s: any) => {
            feed.push({
              id: `sc-${s.id}`,
              title: 'Session completed',
              description: `${s.title} by ${s.recruiter}`,
              timestamp: s.updated_at ?? s.created_at,
              icon: CheckCircle,
              color: 'text-blue-600'
            })
          })
          sessions.filter((s: any) => !s.is_completed).slice(0, 2).forEach((s: any) => {
            feed.push({
              id: `sn-${s.id}`,
              title: 'Session scheduled',
              description: `${s.title} on ${fmt(s.date)}`,
              timestamp: s.created_at,
              icon: Calendar,
              color: 'text-purple-600'
            })
          })
        }
      } catch { /* ignore */ }

      setActivities(
        feed
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 8)
      )

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchAll() }, [fetchAll])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchAll])

  // ── Stat card definitions ──────────────────────────────────────────
  const statCards = [
    { title: 'Total Users',       value: stats.totalUsers.toLocaleString(),                icon: Users,       bg: 'bg-blue-50 dark:bg-blue-950',    color: 'text-blue-600',    sub: `+${stats.recentSignups} this week` },
    { title: 'Active Sessions',   value: stats.activeSessions.toString(),                  icon: Video,       bg: 'bg-green-50 dark:bg-green-950',  color: 'text-green-600',   sub: `${stats.completedSessions} completed` },
    { title: 'Total Revenue',     value: `KES ${stats.totalRevenue.toLocaleString()}`,     icon: DollarSign,  bg: 'bg-emerald-50 dark:bg-emerald-950', color: 'text-emerald-600', sub: 'From session bookings' },
    { title: 'Growth Rate',       value: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`, icon: TrendingUp, bg: stats.growthRate >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950', color: stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600', sub: 'Week over week' },
    { title: 'Assignments',       value: stats.totalAssignments.toString(),                icon: FileText,    bg: 'bg-orange-50 dark:bg-orange-950', color: 'text-orange-600',  sub: `${stats.pendingSubmissions} pending review` },
    { title: 'Approved Submissions', value: stats.approvedSubmissions.toString(),          icon: CheckCircle, bg: 'bg-teal-50 dark:bg-teal-950',    color: 'text-teal-600',    sub: 'Points awarded' },
    { title: 'Active Discounts',  value: stats.activeDiscounts.toString(),                 icon: Gift,        bg: 'bg-pink-50 dark:bg-pink-950',    color: 'text-pink-600',    sub: 'Awarded to users' },
    { title: 'Top Leaderboard',   value: `${stats.topLeaderPoints} pts`,                   icon: Trophy,      bg: 'bg-yellow-50 dark:bg-yellow-950', color: 'text-yellow-600',  sub: 'Highest points earned' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Live platform data
            {lastUpdated && <span className="ml-2">• Updated {formatTime(lastUpdated)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(v => !v)}>
            <Activity className={`h-4 w-4 mr-1.5 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={loading || refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 8 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.title} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.title}</p>
                  {loading
                    ? <div className="h-7 w-20 bg-muted animate-pulse rounded mt-1 mb-1" />
                    : <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                  }
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg} ml-3 shrink-0`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1: Signups + Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Weekly Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={signupTrends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Signups']} />
                <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" /> Revenue by Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueBySession.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No revenue data yet
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueBySession} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => [n === 'revenue' ? `KES ${v}` : v, n === 'revenue' ? 'Revenue' : 'Attendees']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attendees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Demographics + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> User Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demographics.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No demographics data
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={demographics} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                      {demographics.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Users']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5">
                  {demographics.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No recent activity
                  </div>
                </div>
              ) : activities.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`p-1.5 rounded-full bg-background shrink-0 ${a.color}`}>
                    <a.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh indicator */}
      {(loading || refreshing) && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background border rounded-lg shadow-md px-3 py-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {loading ? 'Loading…' : 'Updating…'}
        </div>
      )}
    </div>
  )
}
