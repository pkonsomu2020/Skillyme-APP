import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  Award, 
  Calendar, 
  Target, 
  Clock,
  User,
  Building2,
  X
} from "lucide-react"

interface Assignment {
  id: number
  title: string
  description: string
  instructions?: string
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

interface ViewAssignmentDialogProps {
  assignment: Assignment
  onClose: () => void
}

export function ViewAssignmentDialog({ assignment, onClose }: ViewAssignmentDialogProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSubmissionType = (type: string) => {
    switch (type) {
      case 'text': return 'Text Response'
      case 'link': return 'Links Only'
      case 'file': return 'File Upload'
      case 'mixed': return 'Text + Links'
      default: return type
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Assignment Details
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{assignment.description}</p>
              </div>

              {assignment.instructions && (
                <div>
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{assignment.instructions}</p>
                  </div>
                </div>
              )}

              {assignment.sessions && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Related Session
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">{assignment.sessions.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.sessions.company}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Assignment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Difficulty Level:</span>
                  <Badge className={getDifficultyColor(assignment.difficulty_level)}>
                    {assignment.difficulty_level.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Points Reward:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {assignment.points_reward} pts
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Submission Type:</span>
                  <Badge variant="secondary">
                    {formatSubmissionType(assignment.submission_type)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={assignment.is_active ? "default" : "secondary"}>
                    {assignment.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(assignment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {assignment.due_date && (
                  <div>
                    <span className="text-sm font-medium">Due Date:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assignment.due_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {!assignment.due_date && (
                  <div>
                    <span className="text-sm font-medium">Due Date:</span>
                    <p className="text-sm text-muted-foreground">No due date set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}