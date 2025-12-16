import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Trophy,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import UsersManagement from "./UsersManagement";
import apiService from "@/services/api";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalPayments: number;
  totalRevenue: number;
  activeUsers: number;
  pendingPayments: number;
  thisMonthUsers: number;
  thisMonthRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'user_joined' | 'payment_received' | 'session_booked';
  message: string;
  timestamp: string;
  user?: string;
  amount?: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalPayments: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingPayments: 0,
    thisMonthUsers: 0,
    thisMonthRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive stats from Supabase
      const [usersResponse, paymentsResponse, sessionsResponse] = await Promise.all([
        apiService.getUsersWithStatsFromSupabase(),
        apiService.request('/payments'), // Fallback to API for payments
        apiService.request('/sessions')   // Fallback to API for sessions
      ]);

      if (usersResponse.success) {
        const users = usersResponse.data || [];
        const now = new Date();
        const thisMonth = users.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
        });

        const activeUsers = users.filter(user => 
          user.sessions_attended && user.sessions_attended > 0
        );

        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          thisMonthUsers: thisMonth.length
        }));

        // Generate recent activity from user data
        const activities: RecentActivity[] = users
          .slice(0, 10)
          .map(user => ({
            id: `user_${user.id}`,
            type: 'user_joined' as const,
            message: `${user.name} joined from ${user.country}`,
            timestamp: user.created_at,
            user: user.name
          }));

        setRecentActivity(activities);
      }

      // Handle payments data if available
      if (paymentsResponse?.success) {
        const payments = paymentsResponse.data || [];
        const totalRevenue = payments.reduce((sum: number, payment: { amount?: number }) => sum + (payment.amount || 0), 0);
        const pendingPayments = payments.filter((p: { status?: string }) => p.status === 'pending').length;
        
        setStats(prev => ({
          ...prev,
          totalPayments: payments.length,
          totalRevenue,
          pendingPayments
        }));
      }

      // Handle sessions data if available
      if (sessionsResponse?.success) {
        const sessions = sessionsResponse.data || [];
        setStats(prev => ({
          ...prev,
          totalSessions: sessions.length
        }));
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_joined': return <Users className="w-4 h-4 text-blue-500" />;
      case 'payment_received': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'session_booked': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Skillyme platform</p>
        </div>
        <Button onClick={fetchAdminData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">+{stats.thisMonthUsers} this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{stats.totalPayments} payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">Active sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">With sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                  ) : (
                    recentActivity.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                        </div>
                        {activity.amount && (
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(activity.amount)}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">Add Session</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Download className="w-6 h-6" />
                    <span className="text-sm">Export Data</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm">Leaderboard</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {stats.pendingPayments > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      {stats.pendingPayments} pending payments require review
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Check the payments tab to approve or reject submissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessions Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sessions management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payments management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;