import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Send, Bell, Users, Mail, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminApi, Notification } from "@/services/api"

export default function Notifications() {
  // Notifications will be loaded from backend
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recipientOptions, setRecipientOptions] = useState<{
    fieldsOfStudy: string[]
    institutions: string[]
  }>({ fieldsOfStudy: [], institutions: [] })
  const [loadingOptions, setLoadingOptions] = useState(false)
  const { toast } = useToast()

  // Form state for sending notifications
  const [notificationForm, setNotificationForm] = useState({
    type: "",
    subject: "",
    message: "",
    recipients: "",
    sessionId: "",
    fieldOfStudy: "",
    institution: "",
  })

  // Template messages for different notification types
  const messageTemplates = {
    session_reminder: {
      subject: "Reminder: Your Skillyme Session is Tomorrow",
      message: `Hi {name},

This is a friendly reminder that you have a career session scheduled for tomorrow.

Please make sure to join on time and come prepared with any questions you might have.

We look forward to seeing you there!

Best regards,
The Skillyme Team`
    },
    new_session: {
      subject: "New Career Session Available - Book Now!",
      message: `Hi {name},

We're excited to announce a new career session that might interest you!

Don't miss this opportunity to learn from industry professionals and advance your career.

Visit the Skillyme app to book your spot today.

Best regards,
The Skillyme Team`
    },
    broadcast: {
      subject: "Important Update from Skillyme",
      message: `Hi {name},

We have an important update to share with you.

[Your message here]

Thank you for being part of the Skillyme community!

Best regards,
The Skillyme Team`
    }
  }

  // Handle template selection
  const handleTemplateSelect = (type: string) => {
    const template = messageTemplates[type as keyof typeof messageTemplates]
    if (template) {
      setNotificationForm(prev => ({
        ...prev,
        subject: template.subject,
        message: template.message
      }))
    }
  }

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not during auto-sync
      if (recentNotifications.length === 0) {
        setLoading(true)
      } else {
        setSyncing(true)
      }
      setError(null)

      const response = await adminApi.notifications.getNotificationHistory()
      if (response.success && response.data) {
        setRecentNotifications(response.data.notifications)
        setLastUpdated(new Date())
      } else {
        if (recentNotifications.length === 0) {
          setError('Failed to load notifications')
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
      if (recentNotifications.length === 0) {
        setError('Failed to load notifications')
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [recentNotifications.length])

  // Load recipient options (fields of study and institutions)
  const loadRecipientOptions = useCallback(async () => {
    try {
      setLoadingOptions(true)
      const response = await adminApi.notifications.getRecipientOptions()
      if (response.success && response.data) {
        setRecipientOptions(response.data)
      }
    } catch (err) {
      console.error('Failed to load recipient options:', err)
      toast({
        title: "Warning",
        description: "Failed to load recipient options. You can still type manually.",
        variant: "destructive"
      })
    } finally {
      setLoadingOptions(false)
    }
  }, [toast])

  useEffect(() => {
    loadNotifications()
    loadRecipientOptions()
  }, [loadNotifications, loadRecipientOptions])

  // Auto-sync notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(interval)
  }, [loadNotifications])

  // Validation function
  const validateForm = () => {
    const required = ['type', 'subject', 'message', 'recipients']
    const missing = required.filter(field => !notificationForm[field as keyof typeof notificationForm].trim())
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missing.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    // Additional validation based on recipient type
    if (notificationForm.recipients === 'session' && !notificationForm.sessionId) {
      toast({
        title: "Validation Error",
        description: "Session ID is required when sending to session attendees",
        variant: "destructive"
      })
      return false
    }

    if (notificationForm.recipients === 'field' && !notificationForm.fieldOfStudy) {
      toast({
        title: "Validation Error", 
        description: "Field of study is required when sending to specific field",
        variant: "destructive"
      })
      return false
    }

    if (notificationForm.recipients === 'institution' && !notificationForm.institution) {
      toast({
        title: "Validation Error",
        description: "Institution is required when sending to specific institution",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  // Handle sending notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setSending(true)
      
      const response = await adminApi.notifications.sendNotification({
        type: notificationForm.type,
        subject: notificationForm.subject,
        message: notificationForm.message,
        recipients: notificationForm.recipients,
        sessionId: notificationForm.sessionId ? parseInt(notificationForm.sessionId) : undefined,
        fieldOfStudy: notificationForm.fieldOfStudy || undefined,
        institution: notificationForm.institution || undefined,
      })

      if (response.success) {
        const { totalRecipients, successful, failed } = response.data || {}
        
        toast({
          title: "Notification Sent Successfully!",
          description: `Sent to ${successful}/${totalRecipients} recipients. ${failed > 0 ? `${failed} failed.` : ''}`,
        })
        
        // Reset form
        setNotificationForm({
          type: "",
          subject: "",
          message: "",
          recipients: "",
          sessionId: "",
          fieldOfStudy: "",
          institution: "",
        })

        // Reload notifications
        await loadNotifications()
      } else {
        throw new Error(response.error || 'Failed to send notification')
      }
    } catch (err) {
      console.error('Failed to send notification:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send notification",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications Management
            </h1>
            <p className="text-muted-foreground">Send notifications and emails to all registered users</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
            {syncing ? 'Syncing...' : 'Auto-sync active'}
            {lastUpdated && (
              <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Sent</p>
                  <p className="text-2xl font-bold">{recentNotifications.reduce((sum, n) => sum + n.successful_sends, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {recentNotifications.length > 0 
                      ? Math.round((recentNotifications.reduce((sum, n) => sum + n.successful_sends, 0) / 
                          recentNotifications.reduce((sum, n) => sum + n.target_count, 0)) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Total Campaigns</p>
                  <p className="text-2xl font-bold">{recentNotifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Failed Sends</p>
                  <p className="text-2xl font-bold">{recentNotifications.reduce((sum, n) => sum + n.failed_sends, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send New Notification
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Send notifications to users via email and store in database
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Notification Type *</Label>
                    <Select 
                      value={notificationForm.type} 
                      onValueChange={(value) => {
                        setNotificationForm({...notificationForm, type: value})
                        handleTemplateSelect(value)
                      }}
                    >
                      <SelectTrigger id="notification-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="session_reminder">Session Reminder</SelectItem>
                        <SelectItem value="new_session">New Session Announcement</SelectItem>
                        <SelectItem value="broadcast">Broadcast Message</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecting a type will auto-fill the subject and message with a template
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients *</Label>
                    <Select 
                      value={notificationForm.recipients} 
                      onValueChange={(value) => setNotificationForm({...notificationForm, recipients: value})}
                    >
                      <SelectTrigger id="recipients">
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="session">Session Attendees</SelectItem>
                        <SelectItem value="field">By Field of Study</SelectItem>
                        <SelectItem value="institution">By Institution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {notificationForm.recipients === "session" && (
                  <div className="space-y-2">
                    <Label htmlFor="session-id">Session ID *</Label>
                    <Input 
                      id="session-id" 
                      type="number"
                      placeholder="Enter session ID"
                      value={notificationForm.sessionId}
                      onChange={(e) => setNotificationForm({...notificationForm, sessionId: e.target.value})}
                    />
                  </div>
                )}

                {notificationForm.recipients === "field" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="field-of-study">Field of Study *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={loadRecipientOptions}
                        disabled={loadingOptions}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingOptions ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <Select 
                      value={notificationForm.fieldOfStudy} 
                      onValueChange={(value) => setNotificationForm({...notificationForm, fieldOfStudy: value})}
                    >
                      <SelectTrigger id="field-of-study">
                        <SelectValue placeholder={loadingOptions ? "Loading fields..." : "Select field of study"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingOptions ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : recipientOptions.fieldsOfStudy.length > 0 ? (
                          recipientOptions.fieldsOfStudy.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No fields found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {recipientOptions.fieldsOfStudy.length > 0 
                        ? `${recipientOptions.fieldsOfStudy.length} unique fields available`
                        : "Fields will be loaded from registered users"
                      }
                    </p>
                  </div>
                )}

                {notificationForm.recipients === "institution" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="institution">Institution *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={loadRecipientOptions}
                        disabled={loadingOptions}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingOptions ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <Select 
                      value={notificationForm.institution} 
                      onValueChange={(value) => setNotificationForm({...notificationForm, institution: value})}
                    >
                      <SelectTrigger id="institution">
                        <SelectValue placeholder={loadingOptions ? "Loading institutions..." : "Select institution"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingOptions ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : recipientOptions.institutions.length > 0 ? (
                          recipientOptions.institutions.map((institution) => (
                            <SelectItem key={institution} value={institution}>
                              {institution}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No institutions found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {recipientOptions.institutions.length > 0 
                        ? `${recipientOptions.institutions.length} unique institutions available`
                        : "Institutions will be loaded from registered users"
                      }
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input 
                    id="subject" 
                    placeholder="Enter email subject line"
                    value={notificationForm.subject}
                    onChange={(e) => setNotificationForm({...notificationForm, subject: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here... Use {name} to personalize with user's name"
                    rows={8}
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use {"{name}"} in your message to automatically insert the recipient's name
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={sending}>
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Notification...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recent notifications sent to users
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNotifications}
                  disabled={syncing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                    <p>Send your first notification to get started</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {notification.recipients.toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">{notification.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground ml-4">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{notification.target_count} targeted</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>{notification.successful_sends} sent</span>
                          </div>
                          {notification.failed_sends > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-3 w-3" />
                              <span>{notification.failed_sends} failed</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Success: {Math.round((notification.successful_sends / notification.target_count) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
