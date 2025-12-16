import React, { Suspense, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  CheckCircle, 
  Calendar, 
  Star, 
  Crown,
  Flame,
  Trophy,
  Target,
  Rocket,
  Gift
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { debounce, isMobile } from "@/utils/mobileOptimizations";

// Lazy load heavy components
const TopLeaderboard = React.lazy(() => import("@/components/TopLeaderboard"));

interface MobileOptimizedDashboardProps {
  stats: {
    pointsEarned: number;
    assignmentsCompleted: number;
    upcomingSessions: number;
    currentLevel: string;
  };
  isLoading: boolean;
}

const MobileOptimizedDashboard: React.FC<MobileOptimizedDashboardProps> = ({ 
  stats, 
  isLoading 
}) => {
  const { user } = useAuth();
  const mobile = isMobile();

  // Memoize expensive calculations
  const levelProgress = useMemo(() => {
    const levels = ['Beginner', 'Explorer', 'Intermediate', 'Advanced', 'Expert'];
    const currentIndex = levels.indexOf(stats.currentLevel || 'Beginner');
    return ((currentIndex + 1) / levels.length) * 100;
  }, [stats.currentLevel]);

  const nextLevelPoints = useMemo(() => {
    const levelThresholds = { Beginner: 100, Explorer: 250, Intermediate: 500, Advanced: 1000, Expert: 2000 };
    const levels = ['Beginner', 'Explorer', 'Intermediate', 'Advanced', 'Expert'];
    const currentIndex = levels.indexOf(stats.currentLevel || 'Beginner');
    const nextLevel = levels[currentIndex + 1];
    return nextLevel ? levelThresholds[nextLevel as keyof typeof levelThresholds] : 2000;
  }, [stats.currentLevel]);

  // Optimized stats cards for mobile
  const statsCards = useMemo(() => [
    {
      title: "Points",
      value: stats.pointsEarned,
      icon: Award,
      color: "blue",
      trend: stats.pointsEarned > 0 ? `+${Math.floor(stats.pointsEarned * 0.1)} this week` : null
    },
    {
      title: "Completed",
      value: stats.assignmentsCompleted,
      icon: CheckCircle,
      color: "green",
      badge: stats.assignmentsCompleted === 0 ? "Start now!" : null
    },
    {
      title: "Sessions",
      value: stats.upcomingSessions,
      icon: Calendar,
      color: "purple",
      info: stats.upcomingSessions > 0 ? "Next: Tomorrow" : null
    },
    {
      title: "Rank",
      value: stats.currentLevel,
      icon: Star,
      color: "yellow",
      badge: "Top 10%"
    }
  ], [stats]);

  if (isLoading) {
    return (
      <div className="p-3 space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-xl mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Mobile Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                Welcome, {user?.name?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-xs text-muted-foreground">Level up your career</p>
            </div>
          </div>
          
          {/* Mobile Level Progress */}
          <div className="mt-4 p-3 bg-background/50 backdrop-blur-sm rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold">{stats.currentLevel}</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                {stats.pointsEarned} / {nextLevelPoints} pts
              </Badge>
            </div>
            <Progress value={levelProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {nextLevelPoints - stats.pointsEarned} points to next level
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5`}></div>
            <CardContent className="pt-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`text-lg font-bold text-${stat.color}-600 truncate`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
              
              {stat.trend && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <Trophy className="w-3 h-3" />
                  <span>{stat.trend}</span>
                </div>
              )}
              
              {stat.badge && (
                <Badge variant="outline" className="mt-2 text-xs border-orange-200 text-orange-600">
                  <Flame className="w-3 h-3 mr-1" />
                  {stat.badge}
                </Badge>
              )}
              
              {stat.info && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{stat.info}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Sessions</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Assignments</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Leaderboard */}
      <Suspense fallback={
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <TopLeaderboard />
      </Suspense>

      {/* Mobile Pro Tips */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-primary">Pro Tips</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2 bg-background/50 rounded-lg">
              <span className="text-xs">💡</span>
              <div>
                <p className="text-xs font-medium">Complete daily assignments</p>
                <p className="text-xs text-muted-foreground">Earn consistent points</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-background/50 rounded-lg">
              <span className="text-xs">🎯</span>
              <div>
                <p className="text-xs font-medium">Join career sessions</p>
                <p className="text-xs text-muted-foreground">Network with recruiters</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileOptimizedDashboard;