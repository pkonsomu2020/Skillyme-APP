import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Award,
  Users,
  Target,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateAssignmentForm } from "@/components/CreateAssignmentForm"
import { ReviewSubmissionDialog } from "@/components/ReviewSubmissionDialog"
import { adminApi } from "@/services/api"

interface Assignment {
  id: number
  title: string
  description: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  points_reward: number
  submission_type: string
  due_date?: string
  is_active: boolean
  sessions?: {
    title: string
    company: string
  }
  created_at: string
}

interface Submission {
  id: number
  assignment_id: number
  user_id: number
  submission_text?: string
  submission_links?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  points_earned: number
  submitted_at: string
  admin_feedback?: string
  users: {
    name: string
    email: string
  }
  assignments: {
    title: string
    points_reward: number
  }
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [activeTab, setActiveTab] = useState("assignments")
  const { toast } = useToast()

  useEffect(() => {
    fetchAssignments()
    fetchSubmissions()
  }, [])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await adminApi.assignments.getAllAssignments()
      
      if (response.success && response.data?.assignments) {
        setAssignments(response.data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const response = await adminApi.assignments.getAllSubmissions()
      
      if (response.success && response.data?.submissions) {
        setSubmissions(response.data.submissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const handleAssignmentCreated = (assignment: Assignment) => {
    setAssignments(prev => [assignment, ...prev])
    setShowCreateForm(false)
    toast({
      title: "Success!",
      description: "Assignment created successfully"
    })
  }

  const handleSubmissionReviewed = (reviewedSubmission: Submission) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === reviewedSubmission.id ? reviewedSubmission : sub
      )
    )
    setSelectedSubmission(null)
    toast({
      title: "Success!",
      description: "Submission reviewed successfully"
    })
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'needs_revision': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'needs_revision': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assignments Management</h1>
            <p className="text-muted-foreground">Create and manage assignments, review submissions</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold">{pendingSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Reviews ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <p className="text-muted-foreground mt-1">{assignment.description}</p>
                        {assignment.sessions && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Session: {assignment.sessions.title} • {assignment.sessions.company}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getDifficultyColor(assignment.difficulty_level)}>
                          {assignment.difficulty_level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          <Award className="w-3 h-3 mr-1" />
                          {assignment.points_reward} pts
                        </Badge>
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(assignment.created_at).toLocaleDateString()}
                        {assignment.due_date && (
                          <span className="ml-4">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Assignment
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{submission.assignments.title}</CardTitle>
                        <p className="text-muted-foreground">
                          Submitted by: {submission.users.name} ({submission.users.email})
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(submission.status)}>
                          {getStatusIcon(submission.status)}
                          {submission.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          <Award className="w-3 h-3 mr-1" />
                          {submission.assignments.points_reward} pts
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {submission.submission_text && (
                        <div>
                          <p className="font-medium text-sm mb-1">Response:</p>
                          <p className="text-sm bg-muted p-3 rounded-lg">
                            {submission.submission_text.length > 200 
                              ? `${submission.submission_text.substring(0, 200)}...`
                              : submission.submission_text
                            }
                          </p>
                        </div>
                      )}
                      
                      {submission.submission_links && submission.submission_links.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-1">Links:</p>
                          <div className="space-y-1">
                            {submission.submission_links.map((link, index) => (
                              <a 
                                key={index}
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm block"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => setSelectedSubmission(submission)}
                          size="sm"
                        >
                          Review Submission
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {pendingSubmissions.length === 0 && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending submissions to review</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            <div className="grid gap-4">
              {reviewedSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{submission.assignments.title}</CardTitle>
                        <p className="text-muted-foreground">
                          {submission.users.name} ({submission.users.email})
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(submission.status)}>
                          {getStatusIcon(submission.status)}
                          {submission.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {submission.status === 'approved' && (
                          <Badge variant="outline" className="text-green-600">
                            <Award className="w-3 h-3 mr-1" />
                            +{submission.points_earned} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.admin_feedback && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-medium text-sm mb-1">Admin Feedback:</p>
                        <p className="text-sm">{submission.admin_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Assignment Form */}
        {showCreateForm && (
          <CreateAssignmentForm
            onAssignmentCreated={handleAssignmentCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Review Submission Dialog */}
        {selectedSubmission && (
          <ReviewSubmissionDialog
            submission={selectedSubmission}
            onReviewed={handleSubmissionReviewed}
            onCancel={() => setSelectedSubmission(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}