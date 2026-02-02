import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MobileOptimizedDashboard from "@/components/MobileOptimizedDashboard";
import { 
  Calendar, 
  Award, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Target, 
  Zap, 
  Trophy, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Gift,
  Clock,
  Flame,
  Crown,
  Rocket,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import React, { useState, useEffect } from "react";
import TopLeaderboard from "@/components/TopLeaderboard";
import { isMobile } from "@/utils/mobileOptimizations";

interface DashboardStats {
  pointsEarned: number;
  assignmentsCompleted: number;
  upcomingSessions: number;
  currentLevel: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: string;
  urgent?: boolean;
}

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pointsEarned: 0,
    assignmentsCompleted: 0,
    upcomingSessions: 0,
    currentLevel: 'Beginner'
  });
  const [userDiscounts, setUserDiscounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate current level based on points earned
  const calculateCurrentLevel = () => {
    const points = stats.pointsEarned;
    if (points >= 1000) return 'Expert';
    if (points >= 500) return 'Advanced';
    if (points >= 250) return 'Intermediate';
    if (points >= 100) return 'Explorer';
    return 'Beginner';
  };

  const getCurrentLevel = () => {
    return calculateCurrentLevel(); // Use calculated level instead of backend level
  };

  // Mock achievements data (in real app, fetch from API)
  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first assignment',
      icon: '🎯',
      unlocked: stats.assignmentsCompleted > 0,
      progress: Math.min(stats.assignmentsCompleted * 100, 100)
    },
    {
      id: '2',
      title: 'Point Collector',
      description: 'Earn 100 points',
      icon: '💎',
      unlocked: stats.pointsEarned >= 100,
      progress: Math.min((stats.pointsEarned / 100) * 100, 100)
    },
    {
      id: '3',
      title: 'Session Starter',
      description: 'Join your first career session',
      icon: '🚀',
      unlocked: false,
      progress: 0
    },
    {
      id: '4',
      title: 'Rising Star',
      description: 'Reach Advanced level',
      icon: '⭐',
      unlocked: getCurrentLevel() === 'Advanced' || getCurrentLevel() === 'Expert',
      progress: getCurrentLevel() === 'Expert' ? 100 : getCurrentLevel() === 'Advanced' ? 75 : getCurrentLevel() === 'Intermediate' ? 50 : 25
    }
  ]);

  // Quick actions data
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Browse Sessions',
      description: 'Discover career opportunities',
      icon: Calendar,
      color: 'bg-blue-500',
      action: '/dashboard/sessions'
    },
    {
      id: '2',
      title: 'Complete Assignments',
      description: 'Earn points and level up',
      icon: BookOpen,
      color: 'bg-green-500',
      action: '/dashboard/assignments',
      urgent: stats.assignmentsCompleted === 0
    },
    {
      id: '3',
      title: 'Check Leaderboard',
      description: 'See your ranking',
      icon: Trophy,
      color: 'bg-yellow-500',
      action: '/dashboard/leaderboard'
    },
    {
      id: '4',
      title: 'Find Recruiters',
      description: 'Connect with employers',
      icon: Users,
      color: 'bg-purple-500',
      action: '/dashboard/find-recruiters'
    }
  ];

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Try Supabase first, then fallback to original API
        let response = await apiService.getDashboardStatsFromSupabase(user.id);
        if (!response.success) {
          response = await apiService.getDashboardStats();
        }
        
        if (response.success) {
          // Map Supabase data to expected format
          const supabaseData = response.data;
          setStats({
            pointsEarned: supabaseData.pointsEarned || supabaseData.totalSpent || 0,
            assignmentsCompleted: supabaseData.assignmentsCompleted || supabaseData.totalPayments || 0,
            upcomingSessions: supabaseData.upcomingSessions || supabaseData.sessionsAttended || 0,
            currentLevel: 'Beginner' // Will be calculated by getCurrentLevel()
          });
        } else {
          setError('Failed to fetch dashboard statistics');
        }

        // Fetch user discounts
        try {
          const discountsResponse = await apiService.request('/user/discounts');
          if (discountsResponse.success) {
            setUserDiscounts(discountsResponse.data.discounts || []);
          }
        } catch (discountError) {
          console.warn('Failed to fetch user discounts:', discountError);
        }
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard stats error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  const getLevelProgress = () => {
    const levels = ['Beginner', 'Explorer', 'Intermediate', 'Advanced', 'Expert'];
    const currentLevel = getCurrentLevel();
    const currentIndex = levels.indexOf(currentLevel);
    const points = stats.pointsEarned;
    
    // Calculate progress within current level
    const levelThresholds = [0, 100, 250, 500, 1000, 2000]; // Points needed for each level
    const currentLevelMin = levelThresholds[currentIndex];
    const nextLevelMin = levelThresholds[currentIndex + 1] || 2000;
    
    if (currentIndex === levels.length - 1) {
      return 100; // Max level reached
    }
    
    const progressInLevel = ((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progressInLevel, 100);
  };

  const getNextLevelPoints = () => {
    const levelThresholds = { Beginner: 100, Explorer: 250, Intermediate: 500, Advanced: 1000, Expert: 2000 };
    const levels = ['Beginner', 'Explorer', 'Intermediate', 'Advanced', 'Expert'];
    const currentLevel = getCurrentLevel();
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIndex + 1];
    return nextLevel ? levelThresholds[nextLevel as keyof typeof levelThresholds] : 2000;
  };
  
  // Use mobile-optimized version on small screens
  if (mobile) {
    return <MobileOptimizedDashboard stats={stats} isLoading={isLoading} />;
  }

  return (
    <div className="p-3 md:p-8 space-y-6 md:space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 md:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">
                Welcome back, {user?.name || 'Student'}! 
                <span className="ml-2">👋</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">Ready to level up your career journey?</p>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-6 p-4 bg-background/50 backdrop-blur-sm rounded-xl border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Level: {getCurrentLevel()}</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {stats.pointsEarned} / {getNextLevelPoints()} pts
              </Badge>
            </div>
            <Progress value={getLevelProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getNextLevelPoints() - stats.pointsEarned} points to next level
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? '...' : error ? '0' : stats.pointsEarned}
                </p>
              </div>
            </div>
            {stats.pointsEarned > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+{Math.floor(stats.pointsEarned * 0.1)} this week</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : error ? '0' : stats.assignmentsCompleted}
                </p>
              </div>
            </div>
            {stats.assignmentsCompleted === 0 && (
              <Badge variant="outline" className="mt-2 text-xs border-orange-200 text-orange-600">
                <Flame className="w-3 h-3 mr-1" />
                Start now!
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '...' : error ? '0' : stats.upcomingSessions}
                </p>
              </div>
            </div>
            {stats.upcomingSessions > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                <Clock className="w-3 h-3" />
                <span>Next: Tomorrow</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getCurrentLevel()}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-700 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Top 10%
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <div
                    key={action.id}
                    className="group relative p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    {action.urgent && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Achievements
                <Badge variant="secondary" className="ml-auto">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      achievement.unlocked
                        ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="mt-2">
                            <Progress value={achievement.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.progress.toFixed(0)}% complete
                            </p>
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Leaderboard, Discounts & Tips */}
        <div className="space-y-6">
          <TopLeaderboard />
          
          {/* User Discounts Card */}
          {userDiscounts.length > 0 && (
            <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Gift className="w-5 h-5" />
                  Your Discounts
                  <Badge className="bg-green-100 text-green-800 ml-auto">
                    {userDiscounts.filter(d => d.status === 'active').length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userDiscounts.slice(0, 3).map((discount, index) => (
                  <div key={discount.id || index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-700">{discount.discount_percentage}% OFF</p>
                      <p className="text-xs text-muted-foreground">{discount.discount_type || 'Next Phase'}</p>
                      <p className="text-xs text-muted-foreground">
                        {discount.status === 'active' ? 'Active' : discount.status}
                      </p>
                    </div>
                    <Badge 
                      variant={discount.status === 'active' ? 'default' : 'secondary'}
                      className={discount.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {discount.status === 'active' ? '✅ Ready to Use' : discount.status}
                    </Badge>
                  </div>
                ))}
                {userDiscounts.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{userDiscounts.length - 3} more discounts available
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Pro Tips Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Gift className="w-5 h-5" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Complete assignments daily</p>
                  <p className="text-xs text-muted-foreground">Earn consistent points and climb the leaderboard</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">🎯</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Join career sessions</p>
                  <p className="text-xs text-muted-foreground">Network with recruiters and discover opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">🏆</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Stay active</p>
                  <p className="text-xs text-muted-foreground">Regular engagement unlocks special rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
