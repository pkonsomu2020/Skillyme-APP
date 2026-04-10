import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  TrendingUp,
  Users,
  Target,
  Code2,
  Scale,
  Search,
  X
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";

interface LeaderboardEntry {
  user_id: number;
  name: string;
  email: string;
  total_points: number;
  level_name: string;
  assignments_completed: number;
  sessions_attended?: number;
  payments_count?: number;
  rank: number;
  field_of_study?: string;
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const Leaderboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const response = await apiService.getLeaderboard(500);
      
      if (response.success && response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
        
        const leaderboardData = response.data.leaderboard;
        if (leaderboardData.length > 0) {
          const totalPoints = leaderboardData.reduce((sum: number, entry: LeaderboardEntry) => sum + entry.total_points, 0);
          const averagePoints = totalPoints / leaderboardData.length;
          const topPerformer = leaderboardData[0];
          
          let userRank = undefined;
          if (isAuthenticated && user) {
            const userEntry = leaderboardData.find((entry: LeaderboardEntry) => entry.user_id === user.id);
            if (userEntry) userRank = userEntry.rank;
          }
          
          setStats({
            total_participants: leaderboardData.length,
            average_points: averagePoints,
            top_performer: { name: topPerformer.name, points: topPerformer.total_points },
            your_rank: userRank
          });
        }
      } else {
        setLeaderboard([]);
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to fetch leaderboard');
      setLeaderboard([]);
      setStats(null);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchLeaderboard();

    // Real-time subscription — re-fetch silently whenever user_points changes
    // This covers: new signups, assignment approvals, session joins, any point update
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_points' },
        () => {
          // Any insert or update to user_points → silently refresh leaderboard
          fetchLeaderboard(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        () => {
          // New user signed up → refresh after short delay to let points initialize
          setTimeout(() => fetchLeaderboard(true), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  // Filter leaderboard by field of study, search query, and re-rank
  const getFilteredLeaderboard = () => {
    let filtered = leaderboard;

    // Tab filter
    if (activeTab === "software-engineering") {
      filtered = filtered.filter(e =>
        e.field_of_study?.toLowerCase().includes("software") ||
        e.field_of_study?.toLowerCase().includes("engineering") ||
        e.field_of_study?.toLowerCase().includes("computer")
      );
    } else if (activeTab === "law") {
      filtered = filtered.filter(e =>
        e.field_of_study?.toLowerCase().includes("law") ||
        e.field_of_study?.toLowerCase().includes("legal")
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.name.toLowerCase().includes(q));
    }

    // Re-rank within the filtered list
    return filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));
  };

  const filteredLeaderboard = getFilteredLeaderboard();

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
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 md:gap-3">
          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">See how you rank against other students</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.total_participants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Average Points</p>
                  <p className="text-lg md:text-2xl font-bold">{Math.round(stats.average_points)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="p-1.5 md:p-2 bg-yellow-100 rounded-lg">
                  <Crown className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-sm md:text-lg font-bold truncate">{stats.top_performer.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stats.top_performer.points} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {stats.your_rank && (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                    <Target className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-lg md:text-2xl font-bold">#{stats.your_rank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="software-engineering" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Software Engineering
          </TabsTrigger>
          <TabsTrigger value="law" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Law
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {activeTab === "all" ? "All Rankings" :
                 activeTab === "software-engineering" ? "Software Engineering Rankings" : "Law Rankings"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing active users who have completed assignments, attended sessions, or made payments
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLeaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? `No results for "${searchQuery}"` : "No rankings available yet."}
                    </p>
                  </div>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg border transition-all hover:shadow-md ${
                        isCurrentUser(entry) 
                          ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10' 
                          : 'bg-background hover:bg-muted/50'
                      } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800' : ''}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-8 md:w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-10 h-10 md:w-12 md:h-12">
                        <AvatarFallback className={`text-xs md:text-sm ${entry.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white dark:from-yellow-600 dark:to-orange-600' : 'bg-muted text-muted-foreground'}`}>
                          {getInitials(entry.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                          <h3 className={`font-semibold text-sm md:text-base truncate ${isCurrentUser(entry) ? 'text-primary' : 'text-foreground'}`}>
                            {entry.name}
                            {isCurrentUser(entry) && (
                              <Badge variant="outline" className="ml-1 md:ml-2 text-xs">You</Badge>
                            )}
                          </h3>
                          <Badge className={`${getLevelColor(entry.level_name)} text-xs`}>
                            {entry.level_name}
                          </Badge>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs md:text-sm text-muted-foreground">
                          <span>{entry.assignments_completed} assignments</span>
                          {entry.sessions_attended && entry.sessions_attended > 0 && (
                            <span className="hidden md:inline">{entry.sessions_attended} sessions</span>
                          )}
                          {entry.payments_count && entry.payments_count > 0 && (
                            <span className="hidden md:inline">{entry.payments_count} payments</span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className={`text-lg md:text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'}`}>
                          {entry.total_points.toLocaleString()}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">points</div>
                      </div>

                      {/* Rank Badge - Hidden on mobile, shown in rank icon */}
                      <Badge className={`hidden md:flex ${getRankBadgeColor(entry.rank)} font-bold`}>
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