import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Video, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import { useState, useEffect } from "react";

interface DashboardStats {
  availableSessions: number;
  sessionsJoined: number;
  sessionCost: number;
  recruiters: number;
}

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    availableSessions: 0,
    sessionsJoined: 0,
    sessionCost: 200,
    recruiters: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      // Only fetch if user is authenticated
      if (!user) {
        // PERFORMANCE: Removed excessive logging
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        } else {
          setError('Failed to fetch dashboard statistics');
        }
      } catch (err) {
        // PERFORMANCE: Removed excessive error logging
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]); // Depend on user authentication state
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name || 'Student'}!
        </h2>
        <p className="text-muted-foreground">Your career journey starts here</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-elegant transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Sessions</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : error ? 'Error' : stats.availableSessions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions Joined</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : error ? 'Error' : stats.sessionsJoined}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <Video className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Session Cost</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : error ? 'Error' : `${stats.sessionCost} KES`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recruiters</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : error ? 'Error' : `${stats.recruiters}+`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-bold mb-4">Quick Start Guide</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Browse Sessions</h4>
                <p className="text-sm text-muted-foreground">
                  Check out upcoming career sessions from top companies
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Join a Session</h4>
                <p className="text-sm text-muted-foreground">
                  Pay 200 KES via M-Pesa and submit your transaction code
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Receive Session Link</h4>
                <p className="text-sm text-muted-foreground">
                  Get your Google Meet link directly from the session page
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Connect & Learn</h4>
                <p className="text-sm text-muted-foreground">
                  Join the session, interact with recruiters, and explore opportunities
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
