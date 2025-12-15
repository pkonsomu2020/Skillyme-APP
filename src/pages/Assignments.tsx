import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Award, 
  FileText, 
  Link as LinkIcon, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trophy,
  Target,
  Star
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points_reward: number;
  submission_type: 'text' | 'link' | 'file' | 'mixed';
  due_date?: string;
  session_id?: number;
  sessions?: {
    title: string;
    company: string;
    date: string;
  };
  user_submission?: {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
    points_earned: number;
    submitted_at: string;
    admin_feedback?: string;
  };
}

interface UserStats {
  total_points: number;
  available_points: number;
  points_spent: number;
  level_name: string;
  assignments_completed: number;
  assignments_pending: number;
}

const Assignments = () => {
  const { user, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({
    submission_text: "",
    submission_links: [""],
    submission_files: [""]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    if (isAuthenticated) {
      fetchUserStats();
    }
  }, [isAuthenticated]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.request('/assignments');
      if (response.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiService.request('/assignments/user/points');
      if (response.success) {
        setUserStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'needs_revision': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleSubmission = async () => {
    if (!selectedAssignment || !isAuthenticated) return;

    try {
      setIsSubmitting(true);
      
      const submissionPayload = {
        submission_text: submissionData.submission_text.trim(),
        submission_links: submissionData.submission_links.filter(link => link.trim()),
        submission_files: submissionData.submission_files.filter(file => file.trim())
      };

      const response = await apiService.request(`/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionPayload)
      });

      if (response.success) {
        toast.success('Assignment submitted successfully!');
        setSelectedAssignment(null);
        setSubmissionData({ submission_text: "", submission_links: [""], submission_files: [""] });
        fetchAssignments();
        fetchUserStats();
      }
    } catch (error) {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLinkField = () => {
    setSubmissionData(prev => ({
      ...prev,
      submission_links: [...prev.submission_links, ""]
    }));
  };

  const updateLink = (index: number, value: string) => {
    setSubmissionData(prev => ({
      ...prev,
      submission_links: prev.submission_links.map((link, i) => i === index ? value : link)
    }));
  };

  const removeLink = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      submission_links: prev.submission_links.filter((_, i) => i !== index)
    }));
  };

  const availableAssignments = assignments.filter(a => !a.user_submission);
  const submittedAssignments = assignments.filter(a => a.user_submission);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Assignments & Rewards</h2>
        <p className="text-muted-foreground">Complete assignments to earn points and unlock rewards</p>
      </div>

      {/* User Stats Card */}
      {isAuthenticated && userStats && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userStats.total_points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.available_points}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.assignments_completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  {userStats.level_name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Assignments</TabsTrigger>
          <TabsTrigger value="submitted">My Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <div className="grid gap-6">
            {availableAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assignments available at the moment.</p>
              </div>
            ) : (
              availableAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                        {assignment.sessions && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Related to: {assignment.sessions.title} • {assignment.sessions.company}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getDifficultyColor(assignment.difficulty_level)}>
                          {assignment.difficulty_level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-primary">
                          <Award className="w-3 h-3 mr-1" />
                          {assignment.points_reward} pts
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment.submission_type}
                        </div>
                        {assignment.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {isAuthenticated ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => setSelectedAssignment(assignment)}
                              className="ml-4"
                            >
                              Start Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{assignment.title}</DialogTitle>
                              <DialogDescription>
                                Complete this assignment to earn {assignment.points_reward} points
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {assignment.instructions && (
                                <div>
                                  <h4 className="font-semibold mb-2">Instructions:</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {assignment.instructions}
                                  </p>
                                </div>
                              )}
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="submission_text">Your Response</Label>
                                  <Textarea
                                    id="submission_text"
                                    placeholder="Write your response here..."
                                    value={submissionData.submission_text}
                                    onChange={(e) => setSubmissionData(prev => ({
                                      ...prev,
                                      submission_text: e.target.value
                                    }))}
                                    className="min-h-[120px]"
                                  />
                                </div>
                                
                                {(assignment.submission_type === 'link' || assignment.submission_type === 'mixed') && (
                                  <div>
                                    <Label>Links (Optional)</Label>
                                    {submissionData.submission_links.map((link, index) => (
                                      <div key={index} className="flex gap-2 mt-2">
                                        <Input
                                          placeholder="https://..."
                                          value={link}
                                          onChange={(e) => updateLink(index, e.target.value)}
                                        />
                                        {submissionData.submission_links.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeLink(index)}
                                          >
                                            Remove
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={addLinkField}
                                      className="mt-2"
                                    >
                                      <LinkIcon className="w-4 h-4 mr-2" />
                                      Add Link
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedAssignment(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSubmission}
                                  disabled={isSubmitting || !submissionData.submission_text.trim()}
                                >
                                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button disabled>Login to Submit</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          <div className="grid gap-6">
            {submittedAssignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You haven't submitted any assignments yet.</p>
              </div>
            ) : (
              submittedAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(assignment.user_submission!.status)}>
                          {getStatusIcon(assignment.user_submission!.status)}
                          {assignment.user_submission!.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {assignment.user_submission!.status === 'approved' && (
                          <Badge variant="outline" className="text-green-600">
                            <Award className="w-3 h-3 mr-1" />
                            +{assignment.user_submission!.points_earned} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Submitted: {new Date(assignment.user_submission!.submitted_at).toLocaleDateString()}
                      </div>
                      {assignment.user_submission!.admin_feedback && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-semibold text-sm mb-1">Feedback:</div>
                          <div className="text-sm">{assignment.user_submission!.admin_feedback}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;