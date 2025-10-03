import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  google_meet_link: string;
  recruiter: string;
  company: string;
  price: number;
  paybill_number: string;
  business_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Sessions = () => {
  const { adminToken } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    google_meet_link: '',
    recruiter: '',
    company: '',
    price: 200,
    paybill_number: '714888',
    business_number: '272177'
  });

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/sessions`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessions(data.data.sessions);
        }
      }
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      google_meet_link: '',
      recruiter: '',
      company: '',
      price: 200,
      paybill_number: '714888',
      business_number: '272177'
    });
    setIsEditing(false);
    setSelectedSession(null);
    setIsDialogOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setFormData({
      title: session.title,
      description: session.description || '',
      date: session.date,
      time: session.time,
      google_meet_link: session.google_meet_link || '',
      recruiter: session.recruiter,
      company: session.company,
      price: session.price,
      paybill_number: session.paybill_number,
      business_number: session.business_number
    });
    setIsEditing(true);
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/sessions/${selectedSession?.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/sessions`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Session updated successfully" : "Session created successfully"
        });
        setIsDialogOpen(false);
        fetchSessions();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save session",
          variant: "destructive"
        });
      }
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">Manage career sessions and payment details</p>
        </div>
        <Button onClick={handleCreateSession} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Session
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{session.title}</CardTitle>
                    <CardDescription>
                      {session.company} • {session.recruiter}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Badge variant={session.is_active ? "default" : "secondary"}>
                      {session.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{session.time}</span>
                    </div>
                    <div className="text-sm">
                      <strong>Price:</strong> {session.price} KES
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Paybill:</strong> {session.paybill_number}
                    </div>
                    <div className="text-sm">
                      <strong>Business No:</strong> {session.business_number}
                    </div>
                    {session.google_meet_link && (
                      <div className="text-sm">
                        <strong>Google Meet:</strong> 
                        <a href={session.google_meet_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          Join Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {session.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{session.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Session' : 'Create New Session'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update session details and payment information' : 'Add a new career session with payment details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Law Career Session"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  placeholder="200"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Session description..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recruiter">Recruiter</Label>
                <Input
                  id="recruiter"
                  value={formData.recruiter}
                  onChange={(e) => setFormData({...formData, recruiter: e.target.value})}
                  placeholder="e.g., John Mwangi"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="e.g., Kenya Law Society"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="google_meet_link">Google Meet Link</Label>
              <Input
                id="google_meet_link"
                value={formData.google_meet_link}
                onChange={(e) => setFormData({...formData, google_meet_link: e.target.value})}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paybill_number">Paybill Number</Label>
                  <Input
                    id="paybill_number"
                    value={formData.paybill_number}
                    onChange={(e) => setFormData({...formData, paybill_number: e.target.value})}
                    placeholder="714888"
                  />
                </div>
                <div>
                  <Label htmlFor="business_number">Business Number</Label>
                  <Input
                    id="business_number"
                    value={formData.business_number}
                    onChange={(e) => setFormData({...formData, business_number: e.target.value})}
                    placeholder="272177"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
