import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Calendar, DollarSign, Users, MoreVertical, Search, ArrowLeft, Video, Building2, User, CreditCard, Clock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateSessionForm } from "@/components/CreateSessionForm"
import { adminApi, Session } from "@/services/api"

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { toast } = useToast()

  // Fetch sessions data using the API service
  const fetchSessions = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not during auto-sync
      if (sessions.length === 0) {
        setLoading(true)
      } else {
        setSyncing(true)
      }
      
      const response = await adminApi.sessions.getAllSessions()
      
      if (response.success && response.data?.sessions) {
        setSessions(response.data.sessions)
        setFilteredSessions(response.data.sessions)
        setLastUpdated(new Date())
      } else {
        console.warn("Unexpected API response format:", response)
        
        // Only show error toast on initial load, not during auto-sync
        if (sessions.length === 0) {
          setSessions([])
          setFilteredSessions([])
          
          if (!response.success) {
            toast({
              title: "Error",
              description: response.error || "Failed to load sessions data",
              variant: "destructive",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      
      // Only show error toast on initial load, not during auto-sync
      if (sessions.length === 0) {
        toast({
          title: "Error",
          description: "Failed to load sessions data",
          variant: "destructive",
        })
        setSessions([])
        setFilteredSessions([])
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [toast, sessions.length])

  // Filter sessions based on search term across ALL fields
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSessions(sessions)
    } else {
      const filtered = sessions.filter(session => {
        const searchLower = searchTerm.toLowerCase()
        return (
          session.id.toString().includes(searchLower) ||
          session.title.toLowerCase().includes(searchLower) ||
          session.description.toLowerCase().includes(searchLower) ||
          session.company.toLowerCase().includes(searchLower) ||
          session.recruiter.toLowerCase().includes(searchLower) ||
          session.date.includes(searchLower) ||
          session.time.includes(searchLower) ||
          session.price.toString().includes(searchLower)
        )
      })
      setFilteredSessions(filtered)
    }
  }, [searchTerm, sessions])

  // Load sessions on component mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Auto-sync sessions data every 15 seconds from Supabase database
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions()
    }, 15000) // Sync every 15 seconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval)
    }
  }, [fetchSessions])

  // Handle session creation
  const handleSessionCreated = (newSession: Session) => {
    setSessions(prev => [newSession, ...prev])
    setFilteredSessions(prev => [newSession, ...prev])
    setShowCreateForm(false)
    toast({
      title: "Success!",
      description: "Session created successfully and is now available for users to book",
    })
  }

  // Handle session actions
  const handleToggleActive = async (sessionId: number, isActive: boolean) => {
    try {
      const response = await adminApi.sessions.toggleSessionActive(sessionId, isActive)
      if (response.success) {
        toast({
          title: "Success",
          description: `Session ${isActive ? 'activated' : 'deactivated'} successfully`,
        })
        // Refresh sessions
        await fetchSessions()
      } else {
        throw new Error(response.error || 'Failed to update session')
      }
    } catch (err) {
      console.error('Failed to toggle session:', err)
      toast({
        title: "Error",
        description: "Failed to update session status",
        variant: "destructive"
      })
    }
  }

  const handleMarkCompleted = async (sessionId: number) => {
    try {
      const response = await adminApi.sessions.markSessionCompleted(sessionId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Session marked as completed",
        })
        // Refresh sessions
        await fetchSessions()
      } else {
        throw new Error(response.error || 'Failed to mark session as completed')
      }
    } catch (err) {
      console.error('Failed to mark session as completed:', err)
      toast({
        title: "Error",
        description: "Failed to mark session as completed",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const response = await adminApi.sessions.deleteSession(sessionId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Session deleted successfully",
        })
        // Refresh sessions
        await fetchSessions()
      } else {
        throw new Error(response.error || 'Failed to delete session')
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(`${dateString}T${timeString}`)
      return date.toLocaleString()
    } catch {
      return `${dateString} ${timeString}`
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading sessions...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (showCreateForm) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </div>
          <CreateSessionForm
            onSessionCreated={handleSessionCreated}
            onCancel={() => setShowCreateForm(false)}
          />
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
            <h1 className="text-3xl font-bold">Sessions Management</h1>
            <p className="text-muted-foreground">Create and manage career sessions for users to book</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search sessions by title, company, recruiter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {sessions.length}</span>
            <span>Showing: {filteredSessions.length}</span>
            <span>Active: {sessions.filter(s => s.is_active && !s.is_completed).length}</span>
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-green-500'}`}></div>
                {syncing ? 'Syncing...' : `Last synced: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            )}
          </div>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Career Sessions Database</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete sessions data from Supabase database - Auto-syncs every 15 seconds
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
                {syncing ? 'Syncing...' : 'Auto-sync active'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No sessions found' : 'No sessions yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Create your first session to get started'
                  }
                </p>
                {searchTerm ? (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Session
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">ID</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Title</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Description</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Company</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Recruiter</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Time</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Price (KES)</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Google Meet</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Paybill</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Business #</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Max Attendees</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Current</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Created</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session, index) => (
                      <tr 
                        key={session.id} 
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                        }`}
                      >
                        <td className="p-3 font-mono text-sm font-medium">{session.id}</td>
                        <td className="p-3 font-medium max-w-48 truncate" title={session.title}>
                          {session.title}
                        </td>
                        <td className="p-3 max-w-64 truncate" title={session.description}>
                          {session.description || <span className="text-muted-foreground italic">null</span>}
                        </td>
                        <td className="p-3">
                          {session.company || <span className="text-muted-foreground italic">null</span>}
                        </td>
                        <td className="p-3 font-medium">{session.recruiter}</td>
                        <td className="p-3 font-mono text-xs">{formatDate(session.date)}</td>
                        <td className="p-3 font-mono text-xs">{session.time}</td>
                        <td className="p-3 font-mono">
                          {session.price > 0 ? `KES ${session.price}` : 'Free'}
                        </td>
                        <td className="p-3">
                          {session.google_meet_link ? (
                            <a 
                              href={session.google_meet_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Video className="h-3 w-3" />
                              Meet
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">null</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {session.paybill_number || <span className="text-muted-foreground italic">null</span>}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {session.business_number || <span className="text-muted-foreground italic">null</span>}
                        </td>
                        <td className="p-3 text-center">
                          {session.max_attendees || <span className="text-muted-foreground italic">∞</span>}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {session.current_attendees || 0}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant={session.is_active ? "default" : "secondary"} className="text-xs">
                              {session.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {session.is_completed && (
                              <Badge variant="outline" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs">{formatDate(session.created_at)}</td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                Edit Session
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkCompleted(session.id)}>
                                <Clock className="mr-2 h-4 w-4" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(session.id, !session.is_active)}>
                                {session.is_active ? (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                Delete Session
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
