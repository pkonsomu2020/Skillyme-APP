import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Clock, DollarSign, Users, Video, Building2, User, CreditCard, Image, GraduationCap, Briefcase } from "lucide-react"
import { adminApi, Session } from "@/services/api"

interface EditSessionFormProps {
  session: Session
  onSessionUpdated: (session: Session) => void
  onCancel: () => void
}

export function EditSessionForm({ session, onSessionUpdated, onCancel }: EditSessionFormProps) {
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
    max_attendees: "",
    poster_url: "",
    thumbnail_url: "",
    target_group: "all" as "all" | "form4" | "undergraduate",
    skill_area: "general" as "tech" | "career" | "creative" | "business" | "general"
  })
  const { toast } = useToast()

  // Initialize form with session data
  useEffect(() => {
    if (session) {
      // Normalize time format - remove seconds if present
      let normalizedTime = session.time || ""
      if (normalizedTime) {
        const timeParts = normalizedTime.split(':')
        if (timeParts.length === 3) {
          normalizedTime = `${timeParts[0]}:${timeParts[1]}`
        }
      }

      setFormData({
        title: session.title || "",
        description: session.description || "",
        company: session.company || "",
        google_meet_link: session.google_meet_link || "",
        price: session.price?.toString() || "",
        paybill_number: session.paybill_number || "",
        business_number: session.business_number || "",
        recruiter: session.recruiter || "",
        date: session.date || "",
        time: normalizedTime,
        max_attendees: session.max_attendees?.toString() || "",
        poster_url: session.poster_url || "",
        thumbnail_url: session.thumbnail_url || "",
        target_group: (session.target_group as "all" | "form4" | "undergraduate") || "all",
        skill_area: (session.skill_area as "tech" | "career" | "creative" | "business" | "general") || "general"
      })
    }
  }, [session])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (field: 'target_group' | 'skill_area', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }))
  }

  const validateForm = () => {
    const required = ['title', 'recruiter', 'company', 'date', 'time']
    const missing = required.filter(field => !formData[field as keyof typeof formData].trim())
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missing.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    // Validate time format - accept both HH:MM and HH:MM:SS formats
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
    if (!timeRegex.test(formData.time)) {
      // Try to parse and convert if it's in a different format
      try {
        // If time has seconds, remove them
        const timeParts = formData.time.split(':')
        if (timeParts.length === 3) {
          const normalizedTime = `${timeParts[0]}:${timeParts[1]}`
          setFormData(prev => ({ ...prev, time: normalizedTime }))
          return true
        }
      } catch (e) {
        toast({
          title: "Validation Error",
          description: "Please enter time in HH:MM format (24-hour)",
          variant: "destructive"
        })
        return false
      }
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

      // Normalize time format - ensure it's HH:MM without seconds
      let normalizedTime = formData.time
      const timeParts = normalizedTime.split(':')
      if (timeParts.length === 3) {
        normalizedTime = `${timeParts[0]}:${timeParts[1]}`
      }

      const sessionData: Partial<Session> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        google_meet_link: formData.google_meet_link.trim() || undefined,
        price: formData.price ? parseFloat(formData.price) : 200.00,
        paybill_number: formData.paybill_number.trim() || undefined,
        business_number: formData.business_number.trim() || undefined,
        recruiter: formData.recruiter.trim(),
        date: formData.date,
        time: normalizedTime,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        poster_url: formData.poster_url.trim() || undefined,
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        target_group: formData.target_group as "all" | "form4" | "undergraduate",
        skill_area: formData.skill_area as "tech" | "career" | "creative" | "business" | "general"
      }

      const response = await adminApi.sessions.updateSession(session.id, sessionData)

      if (response.success && response.data) {
        toast({
          title: "Success!",
          description: "Session updated successfully",
        })
        onSessionUpdated(response.data)
      } else {
        throw new Error(response.error || 'Failed to update session')
      }
    } catch (error) {
      console.error('Session update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update session",
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
          Edit Session
        </CardTitle>
        <p className="text-muted-foreground">
          Update the session details below
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
                Company *
              </Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft, Safaricom"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full"
                required
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

          {/* Session Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="target_group" className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Target Group *
              </Label>
              <Select value={formData.target_group} onValueChange={(value) => handleSelectChange('target_group', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="form4">Form 4 Leavers</SelectItem>
                  <SelectItem value="undergraduate">Undergraduate Students</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose who this session is designed for
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_area" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Skill Area *
              </Label>
              <Select value={formData.skill_area} onValueChange={(value) => handleSelectChange('skill_area', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select skill focus area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Career</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="career">Career Development</SelectItem>
                  <SelectItem value="creative">Creative Arts</SelectItem>
                  <SelectItem value="business">Business & Finance</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Main focus area of this session
              </p>
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
              <p className="text-xs text-muted-foreground">Default: KES 200.00 (leave empty for default)</p>
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

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_attendees" className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Attendees
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
              <p className="text-xs text-muted-foreground">Maximum number of attendees allowed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poster_url" className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Poster URL
              </Label>
              <Input
                id="poster_url"
                type="url"
                placeholder="https://example.com/poster.jpg"
                value={formData.poster_url}
                onChange={(e) => handleInputChange('poster_url', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url" className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Thumbnail URL
              </Label>
              <Input
                id="thumbnail_url"
                type="url"
                placeholder="https://example.com/thumb.jpg"
                value={formData.thumbnail_url}
                onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                className="w-full"
              />
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
                'Update Session'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
