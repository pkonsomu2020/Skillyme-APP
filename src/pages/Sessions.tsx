import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Video, ExternalLink } from "lucide-react";
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
}

const Sessions = () => {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sessions from database
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getAllSessions();
        
        if (response.success) {
          // Transform the data to match the expected format
          const transformedSessions = response.data.map((session: any) => ({
            id: session.id,
            title: session.title,
            recruiter: session.recruiter || 'Legal Professionals',
            company: session.company || 'Law Career Session',
            date: session.date,
            time: session.time,
            duration: '90 minutes',
            description: session.description || 'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.',
            google_meet_link: session.google_meet_link || 'https://meet.google.com/nmh-nfxk-oao',
            is_free: true
          }));
          
          setSessions(transformedSessions);
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
  }, []);

  const handleJoinSession = (session: Session) => {
    if (!isAuthenticated) {
      toast.error('Please log in to join sessions');
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Free Career Sessions</h2>
        <p className="text-muted-foreground">Join our free career development sessions with industry professionals</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sessions available at the moment.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-elegant transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{session.title}</CardTitle>
                    <CardDescription className="text-base">
                      {session.company} • {session.recruiter}
                    </CardDescription>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    FREE
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{session.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{session.time} ({session.duration})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer" 
                          onClick={() => window.open(session.google_meet_link, '_blank')}>
                      Google Meet Link
                      <ExternalLink className="w-3 h-3 inline ml-1" />
                    </span>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full"
                  onClick={() => handleJoinSession(session)}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Free Session
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Sessions;