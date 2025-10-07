import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Bell } from "lucide-react"
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

  // Form state for sending notifications
  const [notificationForm, setNotificationForm] = useState({
    type: "",
    subject: "",
    message: "",
    recipients: "",
    sessionId: "",
    fieldOfStudy: "",
  })

  // Load notifications from backend
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await adminApi.notifications.getNotificationHistory()
        if (response.success && response.data) {
          setRecentNotifications(response.data.notifications)
        } else {
          setError('Failed to load notifications')
        }
      } catch (err) {
        console.error('Failed to load notifications:', err)
        setError('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  // Handle sending notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!notificationForm.type || !notificationForm.subject || !notificationForm.message || !notificationForm.recipients) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSending(true)
      
      const response = await adminApi.notifications.sendNotification({
        type: notificationForm.type,
        subject: notificationForm.subject,
        message: notificationForm.message,
        recipients: notificationForm.recipients,
        sessionId: notificationForm.sessionId ? parseInt(notificationForm.sessionId) : undefined,
        fieldOfStudy: notificationForm.fieldOfStudy || undefined,
      })

      if (response.success) {
        alert(`Notification sent successfully! ${response.data?.successfulSends} sent, ${response.data?.failedSends} failed.`)
        
        // Reset form
        setNotificationForm({
          type: "",
          subject: "",
          message: "",
          recipients: "",
          sessionId: "",
          fieldOfStudy: "",
        })

        // Reload notifications
        const notificationsResponse = await adminApi.notifications.getNotificationHistory()
        if (notificationsResponse.success && notificationsResponse.data) {
          setRecentNotifications(notificationsResponse.data.notifications)
        }
      } else {
        alert('Failed to send notification')
      }
    } catch (err) {
      console.error('Failed to send notification:', err)
      alert('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send emails and notifications to users</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-type">Notification Type</Label>
                  <Select 
                    value={notificationForm.type} 
                    onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}
                  >
                    <SelectTrigger id="notification-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session-reminder">Session Reminder</SelectItem>
                      <SelectItem value="new-session">New Session Announcement</SelectItem>
                      <SelectItem value="broadcast">Broadcast Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
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
                    </SelectContent>
                  </Select>
                </div>

                {notificationForm.recipients === "session" && (
                  <div className="space-y-2">
                    <Label htmlFor="session-id">Session ID</Label>
                    <Input 
                      id="session-id" 
                      placeholder="Enter session ID"
                      value={notificationForm.sessionId}
                      onChange={(e) => setNotificationForm({...notificationForm, sessionId: e.target.value})}
                    />
                  </div>
                )}

                {notificationForm.recipients === "field" && (
                  <div className="space-y-2">
                    <Label htmlFor="field-of-study">Field of Study</Label>
                    <Input 
                      id="field-of-study" 
                      placeholder="Enter field of study"
                      value={notificationForm.fieldOfStudy}
                      onChange={(e) => setNotificationForm({...notificationForm, fieldOfStudy: e.target.value})}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="Email subject"
                    value={notificationForm.subject}
                    onChange={(e) => setNotificationForm({...notificationForm, subject: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={6}
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={sending}>
                  <Send className="h-4 w-4" />
                  {sending ? "Sending..." : "Send Notification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Loading notifications from backend...</p>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No notifications found.</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                  <div key={notification.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{notification.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{notification.target_count} recipients</span>
                          <span>•</span>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
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
