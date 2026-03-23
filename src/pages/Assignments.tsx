import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Award, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trophy,
  Target
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
    submission_files?: string[];
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
  const [editingSubmission, setEditingSubmission] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({
    submission_text: "",
    submission_links: [""],
    submission_files: [] as File[]
  });
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

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

    // Guard deadline on the frontend before even hitting the server
    if (isPastDeadline(selectedAssignment.due_date)) {
      toast.error('The deadline for this assignment has passed. Submissions are closed.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      submissionData.submission_files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${apiService.baseURL}/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getAuthToken()}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Assignment submitted successfully!');
        setSelectedAssignment(null);
        setSubmissionData({ submission_text: "", submission_links: [""], submission_files: [] });
        fetchAssignments();
        fetchUserStats();
      } else {
        // Surface the exact backend message
        toast.error(result.message || 'Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit assignment. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPastDeadline = (due_date?: string) => {
    if (!due_date) return false;
    return new Date() > new Date(due_date);
  };

  const handleResubmit = async () => {
    if (!editingSubmission || !isAuthenticated || editFiles.length === 0) return;

    // Guard deadline on the frontend before hitting the server
    if (isPastDeadline(editingSubmission.due_date)) {
      toast.warning('The deadline has passed. You can no longer edit this submission.');
      setEditingSubmission(null);
      setEditFiles([]);
      return;
    }

    // Guard approved status
    if (editingSubmission.user_submission?.status === 'approved') {
      toast.info('This submission has already been approved and cannot be changed.');
      setEditingSubmission(null);
      setEditFiles([]);
      return;
    }

    try {
      setIsResubmitting(true);
      const formData = new FormData();
      editFiles.forEach((file) => formData.append('files', file));

      const response = await fetch(`${apiService.baseURL}/assignments/${editingSubmission.id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiService.getAuthToken()}` },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Submission updated successfully!');
        setEditingSubmission(null);
        setEditFiles([]);
        fetchAssignments();
        fetchUserStats();
      } else {
        // Surface the exact backend message
        toast.error(result.message || 'Failed to update submission. Please try again.');
      }
    } catch (error) {
      console.error('Resubmission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update submission. Please check your connection.');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleEditFileUpload = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const maxSize = 200 * 1024 * 1024;
    const oversized = fileArray.filter(f => f.size > maxSize);
    if (oversized.length > 0) {
      toast.error(`Files exceed 200MB limit: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setEditFiles(prev => [...prev, ...fileArray]);
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

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    
    // Check file sizes
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed the 200MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setSubmissionData(prev => ({
      ...prev,
      submission_files: [...prev.submission_files, ...fileArray]
    }));
  };

  const removeFile = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      submission_files: prev.submission_files.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                  <Award className="w-4 h-4 mr-1" />
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

                              {/* Deadline warning inside dialog */}
                              {assignment.due_date && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                  isPastDeadline(assignment.due_date)
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                  {isPastDeadline(assignment.due_date)
                                    ? <XCircle className="w-4 h-4 shrink-0" />
                                    : <AlertCircle className="w-4 h-4 shrink-0" />}
                                  {isPastDeadline(assignment.due_date)
                                    ? `Deadline passed on ${new Date(assignment.due_date).toLocaleString()} — submissions are closed.`
                                    : `Due: ${new Date(assignment.due_date).toLocaleString()}`}
                                </div>
                              )}
                              
                              <div className="space-y-4">
                                <div>
                                  <Label>Upload Your Submission</Label>
                                  <div className="mt-2">
                                    <div
                                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                      onClick={() => document.getElementById(`file-upload-${assignment.id}`)?.click()}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                                    >
                                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Drag and drop files here, or click to browse
                                      </p>
                                      <p className="text-xs text-muted-foreground mb-4">
                                        Maximum file size: 200MB per file. All file types accepted.
                                      </p>
                                      <Input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                        className="hidden"
                                        id={`file-upload-${assignment.id}`}
                                      />
                                      <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); document.getElementById(`file-upload-${assignment.id}`)?.click(); }}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose Files
                                      </Button>
                                    </div>

                                    {submissionData.submission_files.length > 0 && (
                                      <div className="mt-4 space-y-2">
                                        <Label className="text-sm font-medium">Selected Files:</Label>
                                        {submissionData.submission_files.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                            <div className="flex items-center gap-2">
                                              <FileText className="w-4 h-4 text-muted-foreground" />
                                              <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                              </div>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeFile(index)}
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
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
                                  disabled={isSubmitting || submissionData.submission_files.length === 0 || isPastDeadline(assignment.due_date)}
                                >
                                  {isSubmitting ? 'Submitting...' : isPastDeadline(assignment.due_date) ? 'Deadline Passed' : 'Submit Assignment'}
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
              submittedAssignments.map((assignment) => {
                const sub = assignment.user_submission!;
                const locked = isPastDeadline(assignment.due_date) || sub.status === 'approved';
                const isEditing = editingSubmission?.id === assignment.id;

                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                          <CardDescription>{assignment.description}</CardDescription>
                          {assignment.due_date && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${locked ? 'text-red-500' : 'text-muted-foreground'}`}>
                              <Calendar className="w-3 h-3" />
                              {locked && !sub.status.includes('approved')
                                ? 'Deadline passed — editing closed'
                                : `Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getStatusColor(sub.status)}>
                            {getStatusIcon(sub.status)}
                            <span className="ml-1">{sub.status.replace('_', ' ').toUpperCase()}</span>
                          </Badge>
                          {sub.status === 'approved' && (
                            <Badge variant="outline" className="text-green-600">
                              <Award className="w-3 h-3 mr-1" />
                              +{sub.points_earned} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Submitted date */}
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </p>

                      {/* Previously submitted files */}
                      {sub.submission_files && sub.submission_files.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Current Submission:</p>
                          <div className="space-y-1">
                            {sub.submission_files.map((file, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                <a
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate"
                                >
                                  {file.split('/').pop() || file}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin feedback */}
                      {sub.admin_feedback && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-semibold text-sm mb-1">Feedback:</p>
                          <p className="text-sm">{sub.admin_feedback}</p>
                        </div>
                      )}

                      {/* Edit / resubmit section */}
                      {!locked && (
                        <>
                          {!isEditing ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingSubmission(assignment); setEditFiles([]); }}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Replace Submission
                            </Button>
                          ) : (
                            <div className="space-y-3 border rounded-lg p-4">
                              <p className="text-sm font-medium">Upload a new submission to replace the current one:</p>
                              <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => document.getElementById(`edit-upload-${assignment.id}`)?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleEditFileUpload(e.dataTransfer.files); }}
                              >
                                <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-1">Drag and drop or click to browse</p>
                                <p className="text-xs text-muted-foreground mb-3">Max 200MB per file</p>
                                <Input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  id={`edit-upload-${assignment.id}`}
                                  onChange={(e) => handleEditFileUpload(e.target.files)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); document.getElementById(`edit-upload-${assignment.id}`)?.click(); }}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose Files
                                </Button>
                              </div>

                              {editFiles.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">New files to upload:</p>
                                  {editFiles.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="text-sm font-medium">{file.name}</p>
                                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditFiles(prev => prev.filter((_, idx) => idx !== i))}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setEditingSubmission(null); setEditFiles([]); }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleResubmit}
                                  disabled={isResubmitting || editFiles.length === 0}
                                >
                                  {isResubmitting ? 'Updating...' : 'Update Submission'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {locked && sub.status !== 'approved' && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Editing is closed — the deadline has passed.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;