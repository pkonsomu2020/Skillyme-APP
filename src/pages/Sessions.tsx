import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Video } from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api"; // Import apiService
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

interface Session {
  id: number;
  title: string;
  recruiter: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  description: string;
}

const Sessions = () => {
  const { user, isAuthenticated } = useAuth(); // Get user and auth status from context
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [fullMpesaMessage, setFullMpesaMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
            recruiter: session.recruiter_name || 'Legal Professionals',
            company: session.company || 'Law Career Session',
            date: session.date,
            time: session.time,
            duration: `${session.duration || 90} minutes`,
            description: session.description || 'Join us for an engaging session designed for high school and university students to learn from experienced legal professionals.'
          }));
          
          setSessions(transformedSessions);
        } else {
          toast.error('Failed to fetch sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to fetch sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleJoinSession = (session: Session) => {
    if (!isAuthenticated) {
      toast.error("Please log in to join a session.");
      return;
    }
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!fullMpesaMessage || fullMpesaMessage.trim().length < 50) {
      toast.error("Please paste the complete M-Pesa confirmation message");
      return;
    }

    setIsSubmitting(true);
    try {
      // Assuming session price is 200 KES as per project overview
      const sessionPrice = 200.00; 

      const response = await apiService.submitMpesaCode(
        selectedSession!.id,
        fullMpesaMessage,
        sessionPrice
      );

      if (response.success) {
        toast.success("We'll verify your transaction and email you the Google Meet link shortly. 👉 Check your email inbox (and spam).", {
          duration: 8000, // Show for 8 seconds
          style: {
            background: '#10b981',
            color: 'white',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #059669'
          }
        });
        setIsDialogOpen(false);
        setFullMpesaMessage("");
      } else {
        toast.error(response.message || "Failed to submit M-Pesa code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting M-Pesa code:", error);
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Upcoming Sessions</h2>
        <p className="text-muted-foreground">Browse and join career sessions with top recruiters</p>
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
              </div>

              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => handleJoinSession(session)}
              >
                Join Session - 200 KES
              </Button>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Session</DialogTitle>
            <DialogDescription>
              Complete your payment to join this career session
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="mt-4 space-y-2 p-4 bg-secondary/30 rounded-lg">
              <div className="font-semibold text-foreground">{selectedSession.title}</div>
              <div className="text-sm text-muted-foreground">{selectedSession.company} • {selectedSession.recruiter}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.time}
              </div>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Fee</Label>
              <div className="text-2xl font-bold text-primary">200 KES</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullMpesaMessage">M-Pesa Confirmation Message</Label>
              <Textarea
                id="fullMpesaMessage"
                placeholder="Paste the complete M-Pesa confirmation message here..."
                value={fullMpesaMessage}
                onChange={(e) => setFullMpesaMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Pay 200 KES to M-Pesa number: 0700000000, then paste the complete confirmation message above
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="hero" onClick={handlePayment} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
