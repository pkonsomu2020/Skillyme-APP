import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  user_id: number;
  name: string;
  total_points: number;
  level_name: string;
  rank: number;
}

const TopLeaderboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchTopLeaderboard();
  }, []);

  const fetchTopLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaderboard(10);
      if (response.success) {
        setTopUsers(response.data.leaderboard || []);
        if (response.data.stats?.your_rank) {
          setUserRank(response.data.stats.your_rank);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading rankings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers
          </CardTitle>
          <Link to="/dashboard/leaderboard">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topUsers.length === 0 ? (
            <div className="text-center py-4">
              <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No rankings available yet</p>
            </div>
          ) : (
            <>
              {/* Top 3 Special Display */}
              {topUsers.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrentUser(entry) 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-gradient-to-r from-yellow-50 to-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>

                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`text-xs ${entry.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-muted'}`}>
                      {getInitials(entry.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm truncate ${isCurrentUser(entry) ? 'text-primary' : ''}`}>
                        {entry.name}
                        {isCurrentUser(entry) && (
                          <span className="text-xs text-primary ml-1">(You)</span>
                        )}
                      </p>
                      <Badge className={`${getLevelColor(entry.level_name)} text-xs`}>
                        {entry.level_name}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold text-sm ${entry.rank <= 3 ? 'text-yellow-600' : 'text-primary'}`}>
                      {entry.total_points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              ))}

              {/* Remaining entries (4-10) - Compact display */}
              {topUsers.slice(3).map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    isCurrentUser(entry) 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-6">
                    <span className="text-xs font-bold text-muted-foreground">#{entry.rank}</span>
                  </div>

                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(entry.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isCurrentUser(entry) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {entry.name}
                      {isCurrentUser(entry) && <span className="text-primary ml-1">(You)</span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">{entry.total_points.toLocaleString()}</div>
                  </div>
                </div>
              ))}

              {/* User's rank if not in top 10 */}
              {isAuthenticated && userRank && userRank > 10 && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-center w-6">
                      <span className="text-xs font-bold text-primary">#{userRank}</span>
                    </div>
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(user?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">
                        {user?.name} (You)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">Your Position</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopLeaderboard;