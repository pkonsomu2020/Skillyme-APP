import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, DollarSign, Users, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { adminApi, Session } from "@/services/api"

export default function Sessions() {
  // Sessions will be loaded from backend
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sessions from backend
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await adminApi.sessions.getAllSessions()
        if (response.success && response.data) {
          setSessions(response.data.sessions)
        } else {
          setError('Failed to load sessions')
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
        setError('Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [])

  // Handle session actions
  const handleToggleActive = async (sessionId: number, isActive: boolean) => {
    try {
      const response = await adminApi.sessions.toggleSessionActive(sessionId, isActive)
      if (response.success) {
        // Reload sessions
        const sessionsResponse = await adminApi.sessions.getAllSessions()
        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data.sessions)
        }
      }
    } catch (err) {
      console.error('Failed to toggle session:', err)
    }
  }

  const handleMarkCompleted = async (sessionId: number) => {
    try {
      const response = await adminApi.sessions.markSessionCompleted(sessionId)
      if (response.success) {
        // Reload sessions
        const sessionsResponse = await adminApi.sessions.getAllSessions()
        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data.sessions)
        }
      }
    } catch (err) {
      console.error('Failed to mark session as completed:', err)
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        const response = await adminApi.sessions.deleteSession(sessionId)
        if (response.success) {
          // Reload sessions
          const sessionsResponse = await adminApi.sessions.getAllSessions()
          if (sessionsResponse.success && sessionsResponse.data) {
            setSessions(sessionsResponse.data.sessions)
          }
        }
      } catch (err) {
        console.error('Failed to delete session:', err)
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">Manage upcoming career sessions</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Loading sessions from backend...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No sessions found. Create your first session!</p>
            </div>
          ) : (
            sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{session.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Recruiter: {session.recruiter} • Company: {session.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.is_active ? "default" : "secondary"}>
                      {session.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkCompleted(session.id)}>
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(session.id, !session.is_active)}>
                          {session.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="text-sm font-medium">
                        {session.date} at {session.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-medium">KES {session.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Max Attendees</p>
                      <p className="text-sm font-medium">{session.max_attendees || 'Unlimited'}</p>
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
