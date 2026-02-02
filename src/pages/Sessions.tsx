import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, ExternalLink, GraduationCap, BookOpen, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Session {
  id: number;
  title: string;
  recruiter: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  google_meet_link: string;
  is_free: boolean;
  target_group: 'form4' | 'undergraduate' | 'all';
  skill_area: 'tech' | 'career' | 'creative' | 'business' | 'general';
}

interface SessionAccess {
  [sessionId: number]: boolean;
}

const Sessions = () => {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionAccess, setSessionAccess] = useState<SessionAccess>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch sessions from database
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getAllSessions();
        
        if (response.success) {
          // Transform the data to match the expected format
          const transformedSessions = response.data.sessions.map((session: any) => ({
            id: session.id,
            title: session.title,
            recruiter: session.recruiter || 'Legal Professionals',
            company: session.company || 'Law Career Session',
            date: session.date,
            time: session.time,
            duration: '90 minutes',
            description: session.description || 'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.',
            google_meet_link: session.google_meet_link || 'https://meet.google.com/nmh-nfxk-oao',
            is_free: true,
            target_group: session.target_group || 'all',
            skill_area: session.skill_area || 'general'
          }));
          
          setSessions(transformedSessions);
          
          // Fetch session access for authenticated users
          if (isAuthenticated && user) {
            await fetchSessionAccess(transformedSessions);
          }
        } else {
          toast.error('Failed to fetch sessions');
        }
      } catch (error: any) {
        toast.error('Failed to fetch sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated, user]);

  // Fetch user's session access permissions
  const fetchSessionAccess = async (sessionsList: Session[]) => {
    try {
      const accessPromises = sessionsList.map(async (session) => {
        try {
          const response = await apiService.checkSessionAccess(session.id);
          
          return {
            sessionId: session.id,
            hasAccess: response.success ? response.data.hasAccess : false
          };
        } catch (error) {
          console.warn(`Failed to check access for session ${session.id}:`, error);
          return {
            sessionId: session.id,
            hasAccess: false
          };
        }
      });

      const accessResults = await Promise.all(accessPromises);
      const accessMap: SessionAccess = {};
      
      accessResults.forEach(({ sessionId, hasAccess }) => {
        accessMap[sessionId] = hasAccess;
      });
      
      setSessionAccess(accessMap);
    } catch (error) {
      console.error('Error fetching session access:', error);
    }
  };

  const handleJoinSession = (session: Session) => {
    if (!isAuthenticated) {
      toast.error('Please log in to join sessions');
      return;
    }

    // Check if user has access to this session
    if (!sessionAccess[session.id]) {
      toast.error('Access not granted. Please contact admin for session access.');
      return;
    }
    
    // Open Google Meet link in new tab
    window.open(session.google_meet_link, '_blank');
    
    toast.success('Opening Google Meet session...', {
      duration: 3000,
      style: {
        background: '#10b981',
        color: 'white',
        fontSize: '14px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #059669'
      }
    });
  };

  // Filter sessions based on active tab
  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all') return true;
    return session.target_group === activeTab || session.target_group === 'all';
  });

  // Get skill area badge color
  const getSkillAreaColor = (skillArea: string) => {
    switch (skillArea) {
      case 'tech': return 'bg-blue-100 text-blue-800';
      case 'career': return 'bg-green-100 text-green-800';
      case 'creative': return 'bg-purple-100 text-purple-800';
      case 'business': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render session card
  const renderSessionCard = (session: Session) => {
    const hasAccess = sessionAccess[session.id] || false;
    
    return (
      <Card key={session.id} className="hover:shadow-elegant transition-smooth h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg mb-1 line-clamp-2 leading-tight">{session.title}</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {session.company} • {session.recruiter}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                FREE
              </Badge>
              <Badge className={`${getSkillAreaColor(session.skill_area)} text-xs px-2 py-0.5`}>
                {session.skill_area.charAt(0).toUpperCase() + session.skill_area.slice(1)}
              </Badge>
              {isAuthenticated && (
                <Badge className={`text-xs px-2 py-0.5 ${
                  hasAccess 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {hasAccess ? 'Access Granted' : 'Access Pending'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 flex-1 flex flex-col">
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 flex-shrink-0">{session.description}</p>
          
          <div className="space-y-1.5 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{new Date(session.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{session.time} ({session.duration})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Video className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer truncate" 
                    onClick={() => window.open(session.google_meet_link, '_blank')}>
                Google Meet Link
                <ExternalLink className="w-2 h-2 inline ml-1" />
              </span>
            </div>
          </div>

          {!isAuthenticated ? (
            <Button 
              variant="outline" 
              className="w-full h-9 text-sm mt-auto"
              disabled
            >
              <Lock className="w-3 h-3 mr-2" />
              Login Required
            </Button>
          ) : hasAccess ? (
            <Button 
              variant="hero" 
              className="w-full h-9 text-sm mt-auto"
              onClick={() => handleJoinSession(session)}
            >
              <Video className="w-3 h-3 mr-2" />
              Join Free Session
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full h-9 text-sm mt-auto"
              disabled
            >
              <Lock className="w-3 h-3 mr-2" />
              Access Pending
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-3 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Career Sessions</h2>
        <p className="text-sm md:text-base text-muted-foreground">Join personalized career development sessions with industry professionals</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 h-auto">
          <TabsTrigger value="all" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-center leading-tight">All Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="form4" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
            <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-center leading-tight">Form 4 Leavers</span>
          </TabsTrigger>
          <TabsTrigger value="undergraduate" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
            <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-center leading-tight">Undergraduate Students</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No sessions available for all students at the moment.</p>
              </div>
            ) : (
              filteredSessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="form4" className="mt-0">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">🎓 For Form 4 Leavers</h3>
            <p className="text-sm text-blue-800">
              Sessions designed specifically for high school graduates exploring career paths, 
              university options, and entry-level opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No sessions available for Form 4 leavers at the moment.</p>
              </div>
            ) : (
              filteredSessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="undergraduate" className="mt-0">
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">📘 For Undergraduate Students</h3>
            <p className="text-sm text-green-800">
              Advanced sessions for university students focusing on internships, 
              career development, and professional networking opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No sessions available for undergraduate students at the moment.</p>
              </div>
            ) : (
              filteredSessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sessions;