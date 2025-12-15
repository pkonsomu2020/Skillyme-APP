import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { FileText, Award, Calendar, Target, X } from "lucide-react"
import { adminApi } from "@/services/api"

interface Assignment {
  id: number
  title: string
  description: string
  instructions?: string
  session_id?: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  points_reward: number
  submission_type: 'text' | 'link' | 'file' | 'mixed'
  due_date?: string
  is_active: boolean
}

interface Session {
  id: number
  title: string
  company: string
  date: string
}

interface EditAssignmentFormProps {
  assignment: Assignment
  onAssignmentUpdated: (assignment: Assignment) => void
  onCancel: () => void
}

export function EditAssignmentForm({ assignment, onAssignmentUpdated, onCancel }: EditAssignmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [formData, setFormData] = useState({
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions || "",
    session_id: assignment.session_id?.toString() || "",
    difficulty_level: assignment.difficulty_level,
    points_reward: assignment.points_reward.toString(),
    submission_type: assignment.submission_type,
    due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : "",
    is_active: assignment.is_active
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await adminApi.sessions.getAllSessions()
      if (response.success && response.data?.sessions) {
        setSessions(response.data.sessions.filter((s: any) => s.is_active))
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (field: 'difficulty_level' | 'submission_type', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }))
  }

  const validateForm = () => {
    const required = ['title', 'description']
    const missing = required.filter(field => !formData[field as keyof typeof formData].toString().trim())
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missing.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    // Validate due date is not in the past (if set)
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date)
      if (dueDate < new Date()) {
        toast({
          title: "Validation Error",
          description: "Due date cannot be in the past",
          variant: "destructive"
        })
        return false
      }
    }

    return true
  }

  const getDefaultPoints = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 10
      case 'medium': return 25
      case 'hard': return 50
      default: return 10
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim() || undefined,
        session_id: formData.session_id ? parseInt(formData.session_id) : undefined,
        difficulty_level: formData.difficulty_level,
        points_reward: formData.points_reward ? parseInt(formData.points_reward) : getDefaultPoints(formData.difficulty_level),
        submission_type: formData.submission_type,
        due_date: formData.due_date || undefined,
        is_active: formData.is_active
      }

      console.log('🚀 Updating assignment with data:', updateData)

      const response = await adminApi.assignments.updateAssignment(assignment.id, updateData)

      console.log('📊 Assignment update response:', response)

      if (response.success && response.data) {
        onAssignmentUpdated(response.data.assignment)
      } else {
        throw new Error(response.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Assignment update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Edit Assignment
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Update the assignment details and settings
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Assignment Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Create a Professional Resume"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_id" className="text-sm font-medium">
                  Related Session (Optional)
                </Label>
                <Select value={formData.session_id} onValueChange={(value) => handleInputChange('session_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific session</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.title} • {session.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Assignment Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what students need to accomplish in this assignment..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full min-h-[100px]"
                rows={4}
                required
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-sm font-medium">
                Detailed Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Provide step-by-step instructions, requirements, and any additional guidance..."
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                className="w-full min-h-[120px]"
                rows={5}
              />
            </div>

            {/* Assignment Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="text-sm font-medium">
                  Difficulty Level
                </Label>
                <Select value={formData.difficulty_level} onValueChange={(value) => handleSelectChange('difficulty_level', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (10 pts default)</SelectItem>
                    <SelectItem value="medium">Medium (25 pts default)</SelectItem>
                    <SelectItem value="hard">Hard (50 pts default)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission_type" className="text-sm font-medium">
                  Submission Type
                </Label>
                <Select value={formData.submission_type} onValueChange={(value) => handleSelectChange('submission_type', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select submission type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="link">Links Only</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="mixed">Text + Links</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_reward" className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Points Reward
                </Label>
                <Input
                  id="points_reward"
                  type="number"
                  placeholder={getDefaultPoints(formData.difficulty_level).toString()}
                  value={formData.points_reward}
                  onChange={(e) => handleInputChange('points_reward', e.target.value)}
                  className="w-full"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            {/* Due Date and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date (Optional)
                </Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Assignment Status
                </Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="text-sm">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
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
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Assignment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}