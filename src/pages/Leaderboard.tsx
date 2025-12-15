import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Star, 
  TrendingUp,
  Calendar,
  Users,
  Target
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  user_id: number;
  name: string;
  email: string;
  total_points: number;
  available_points: number;
  level_name: string;
  assignments_completed: number;
  rank: number;
}

interface LeaderboardStats {
  total_participants: number;
  average_points: number;
  top_performer: {
    name: string;
    points: number;
  };
  your_rank?: number;
}

const Leaderboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-time");

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Determine the period based on active tab
      let period = undefined;
      if (activeTab === "weekly") period = "week";
      if (activeTab === "monthly") period = "month";
      
      const response = await apiService.getLeaderboard(50, period);
      if (response.success) {
        setLeaderboard(response.data.leaderboard || []);
        setStats(response.data.stats || null);
      }
    } catch (error) {
      toast.error('Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3: return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'explorer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return isAuthenticated && user && entry.user_id === user.id;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-muted-foreground">See how you rank against other students</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">{stats.total_participants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Points</p>
                  <p className="text-2xl font-bold">{Math.round(stats.average_points)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-bold">{stats.top_performer.name}</p>
                  <p className="text-sm text-muted-foreground">{stats.top_performer.points} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {stats.your_rank && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-2xl font-bold">#{stats.your_rank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-time" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            All Time
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            This Month
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            This Week
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {activeTab === "all-time" ? "All Time Rankings" : 
                 activeTab === "monthly" ? "Monthly Rankings" : "Weekly Rankings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No rankings available yet.</p>
                  </div>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                        isCurrentUser(entry) 
                          ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10' 
                          : 'bg-background hover:bg-muted/50'
                      } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className={`${entry.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-muted'}`}>
                          {getInitials(entry.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${isCurrentUser(entry) ? 'text-primary' : ''}`}>
                            {entry.name}
                            {isCurrentUser(entry) && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                          </h3>
                          <Badge className={getLevelColor(entry.level_name)}>
                            {entry.level_name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.assignments_completed} assignments completed
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-600' : 'text-primary'}`}>
                          {entry.total_points.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>

                      {/* Rank Badge */}
                      <Badge className={`${getRankBadgeColor(entry.rank)} font-bold`}>
                        #{entry.rank}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;