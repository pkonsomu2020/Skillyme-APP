import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Clock, DollarSign, Users, Video, Building2, User, CreditCard } from "lucide-react"
import { adminApi, Session } from "@/services/api"

interface CreateSessionFormProps {
  onSessionCreated: (session: Session) => void
  onCancel: () => void
}

export function CreateSessionForm({ onSessionCreated, onCancel }: CreateSessionFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    google_meet_link: "",
    price: "",
    paybill_number: "",
    business_number: "",
    recruiter: "",
    date: "",
    time: "",
    max_attendees: ""
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const required = ['title', 'recruiter', 'date', 'time']
    const missing = required.filter(field => !formData[field as keyof typeof formData].trim())
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missing.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    // Validate date is not in the past
    const sessionDate = new Date(`${formData.date}T${formData.time}`)
    if (sessionDate < new Date()) {
      toast({
        title: "Validation Error",
        description: "Session date and time cannot be in the past",
        variant: "destructive"
      })
      return false
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(formData.time)) {
      toast({
        title: "Validation Error",
        description: "Please enter time in HH:MM format (24-hour)",
        variant: "destructive"
      })
      return false
    }

    // Validate Google Meet link if provided
    if (formData.google_meet_link && !formData.google_meet_link.includes('meet.google.com')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid Google Meet link",
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

      const sessionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        google_meet_link: formData.google_meet_link.trim() || undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        paybill_number: formData.paybill_number.trim() || undefined,
        business_number: formData.business_number.trim() || undefined,
        recruiter: formData.recruiter.trim(),
        date: formData.date,
        time: formData.time,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined
      }

      const response = await adminApi.sessions.createSession(sessionData)

      if (response.success && response.data) {
        toast({
          title: "Success!",
          description: "Session created successfully and is now live for users to book",
        })
        onSessionCreated(response.data)
      } else {
        throw new Error(response.error || 'Failed to create session')
      }
    } catch (error) {
      console.error('Session creation error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create session",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Create New Session
        </CardTitle>
        <p className="text-muted-foreground">
          Fill in the details below to create a new career session that will be available for users to book
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Session Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Software Engineering Career Session"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Recruiter Name *
              </Label>
              <Input
                id="recruiter"
                placeholder="e.g., John Doe"
                value={formData.recruiter}
                onChange={(e) => handleInputChange('recruiter', e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Session Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this session will cover, what attendees will learn, and any prerequisites..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Company and Meeting Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft, Safaricom"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_meet_link" className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Google Meet Link
              </Label>
              <Input
                id="google_meet_link"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={formData.google_meet_link}
                onChange={(e) => handleInputChange('google_meet_link', e.target.value)}
                className="w-full"
                type="url"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Session Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Pricing and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price (KES)
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">Leave empty or 0 for free sessions</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paybill_number" className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paybill Number
              </Label>
              <Input
                id="paybill_number"
                placeholder="e.g., 174379"
                value={formData.paybill_number}
                onChange={(e) => handleInputChange('paybill_number', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_number" className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Business Number
              </Label>
              <Input
                id="business_number"
                placeholder="e.g., 123456"
                value={formData.business_number}
                onChange={(e) => handleInputChange('business_number', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Max Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_attendees" className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Maximum Attendees
              </Label>
              <Input
                id="max_attendees"
                type="number"
                placeholder="e.g., 50"
                value={formData.max_attendees}
                onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                className="w-full"
                min="1"
              />
              <p className="text-xs text-muted-foreground">Leave empty for unlimited attendees</p>
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
                  Creating...
                </div>
              ) : (
                'Create Session'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}