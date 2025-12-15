import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Award, User, Calendar, Link as LinkIcon } from "lucide-react"
import { adminApi } from "@/services/api"

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

interface ReviewSubmissionDialogProps {
  submission: Submission
  onReviewed: (reviewedSubmission: Submission) => void
  onCancel: () => void
}

export function ReviewSubmissionDialog({ submission, onReviewed, onCancel }: ReviewSubmissionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [reviewData, setReviewData] = useState({
    status: "" as "approved" | "rejected" | "needs_revision" | "",
    admin_feedback: "",
    points_earned: submission.assignments.points_reward.toString()
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStatusChange = (status: "approved" | "rejected" | "needs_revision") => {
    setReviewData(prev => ({
      ...prev,
      status,
      // Reset points to 0 if rejected
      points_earned: status === 'rejected' ? '0' : submission.assignments.points_reward.toString()
    }))
  }

  const validateForm = () => {
    if (!reviewData.status) {
      toast({
        title: "Validation Error",
        description: "Please select a review status",
        variant: "destructive"
      })
      return false
    }

    if (reviewData.status === 'approved' && (!reviewData.points_earned || parseInt(reviewData.points_earned) < 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter valid points for approved submission",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      const reviewPayload = {
        status: reviewData.status as "approved" | "rejected" | "needs_revision",
        admin_feedback: reviewData.admin_feedback.trim(),
        points_earned: parseInt(reviewData.points_earned) || 0
      }

      const response = await adminApi.assignments.reviewSubmission(submission.id, reviewPayload)

      if (response.success && response.data) {
        onReviewed(response.data.submission)
      } else {
        throw new Error(response.error || 'Failed to review submission')
      }
    } catch (error) {
      console.error('Review submission error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to review submission",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'needs_revision': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'needs_revision': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review Submission</DialogTitle>
          <DialogDescription>
            Review and provide feedback for this assignment submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{submission.assignments.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{submission.users.name}</span>
                  <span className="text-muted-foreground">({submission.users.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span>Potential Points: {submission.assignments.points_reward}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submission Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.submission_text && (
                <div>
                  <Label className="text-sm font-medium">Response:</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{submission.submission_text}</p>
                  </div>
                </div>
              )}

              {submission.submission_links && submission.submission_links.length > 0 && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Submitted Links:
                  </Label>
                  <div className="mt-2 space-y-2">
                    {submission.submission_links.map((link, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Review Status *
                    </Label>
                    <Select value={reviewData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select review status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Approved
                          </div>
                        </SelectItem>
                        <SelectItem value="needs_revision">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            Needs Revision
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            Rejected
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points_earned" className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Points to Award
                    </Label>
                    <Input
                      id="points_earned"
                      type="number"
                      value={reviewData.points_earned}
                      onChange={(e) => handleInputChange('points_earned', e.target.value)}
                      className="w-full"
                      min="0"
                      max={submission.assignments.points_reward}
                      disabled={reviewData.status === 'rejected'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum: {submission.assignments.points_reward} points
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_feedback" className="text-sm font-medium">
                    Feedback for Student
                  </Label>
                  <Textarea
                    id="admin_feedback"
                    placeholder="Provide constructive feedback to help the student improve..."
                    value={reviewData.admin_feedback}
                    onChange={(e) => handleInputChange('admin_feedback', e.target.value)}
                    className="w-full min-h-[100px]"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This feedback will be visible to the student
                  </p>
                </div>

                {/* Preview */}
                {reviewData.status && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Preview:</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={getStatusColor(reviewData.status)}>
                        {getStatusIcon(reviewData.status)}
                        {reviewData.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {reviewData.status === 'approved' && (
                        <Badge variant="outline" className="text-green-600">
                          <Award className="w-3 h-3 mr-1" />
                          +{reviewData.points_earned} points
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !reviewData.status}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}