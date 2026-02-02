import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle, XCircle, Users, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { adminApi, User } from "@/services/api"

interface UserWithAccess {
  id: number
  name: string
  email: string
  phone: string
  country: string
  county: string | null
  field_of_study: string
  institution: string
  level_of_study: string
  created_at: string
  updated_at: string
  password: string
  preferred_name: string | null
  date_of_birth: string | null
  course_of_study: string | null
  degree: string | null
  year_of_study: string | null
  primary_field_interest: string | null
  signup_source: string | null
  user_id?: number
  access_granted: boolean | null
  admin_notes?: string | null
  granted_at?: string | null
  granted_by?: number | null
}

interface SessionAccessManagerProps {
  sessionId: number
  sessionTitle: string
  onBack: () => void
}

export function SessionAccessManager({ sessionId, sessionTitle, onBack }: SessionAccessManagerProps) {
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingUsers, setProcessingUsers] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Memoized filtered users with safe search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return users.filter(user => {
      try {
        // Safe string checking function
        const safeIncludes = (value: string | null | undefined): boolean => {
          return value ? value.toLowerCase().includes(searchLower) : false
        }
        
        return (
          safeIncludes(user.name) ||
          safeIncludes(user.email) ||
          safeIncludes(user.phone) ||
          safeIncludes(user.field_of_study) ||
          safeIncludes(user.institution) ||
          safeIncludes(user.country) ||
          safeIncludes(user.county) ||
          safeIncludes(user.preferred_name) ||
          safeIncludes(user.course_of_study) ||
          safeIncludes(user.degree) ||
          safeIncludes(user.year_of_study) ||
          safeIncludes(user.primary_field_interest) ||
          safeIncludes(user.signup_source) ||
          user.id.toString().includes(searchLower)
        )
      } catch (error) {
        console.error('Search filter error for user:', user.id, error)
        return false
      }
    })
  }, [users, searchTerm])

  // Load users with their access status from database
  useEffect(() => {
    loadUsersWithAccessStatus()
  }, [sessionId])

  const loadUsersWithAccessStatus = async () => {
    try {
      setLoading(true)
      
      // Get users with their access status for this session from the correct API endpoint
      const response = await adminApi.sessionAccess.getUsersForSession(sessionId)
      
      if (!response.success || !response.data?.users) {
        throw new Error(response.error || 'Failed to load users with access status')
      }

      // Transform the backend data to match our frontend interface
      const usersWithAccess: UserWithAccess[] = response.data.users.map((user: any) => ({
        id: user.user_id || user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        country: user.country || 'N/A',
        county: user.county,
        field_of_study: user.field_of_study || 'N/A',
        institution: user.institution || 'N/A',
        level_of_study: user.level_of_study || 'N/A',
        created_at: user.created_at || '',
        updated_at: user.updated_at || '',
        password: '', // Not needed for display
        preferred_name: user.preferred_name,
        date_of_birth: user.date_of_birth,
        course_of_study: user.course_of_study,
        degree: user.degree,
        year_of_study: user.year_of_study,
        primary_field_interest: user.primary_field_interest,
        signup_source: user.signup_source,
        user_id: user.user_id,
        access_granted: user.access_granted,
        admin_notes: user.admin_notes,
        granted_at: user.granted_at,
        granted_by: user.granted_by
      }))
      
      setUsers(usersWithAccess)
      
      toast({
        title: "Users Loaded Successfully",
        description: `Loaded ${usersWithAccess.length} users with their current access status from database`,
      })
      
    } catch (error) {
      console.error('Error loading users with access status:', error)
      toast({
        title: "Database Error",
        description: "Failed to load users from database. Please check your connection and try again.",
        variant: "destructive",
      })
      
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAccess = async (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessingUsers(prev => new Set(prev).add(userId))
      
      const newAccess = !user.access_granted
      const adminNotes = newAccess 
        ? `Access granted for session: ${sessionTitle}` 
        : `Access revoked for session: ${sessionTitle}`
      
      // Make API call to update database
      const response = await adminApi.sessionAccess.grantAccess({
        userId,
        sessionId,
        accessGranted: newAccess,
        adminNotes
      })

      if (response.success) {
        // Update ONLY the specific user in local state
        setUsers(prevUsers => prevUsers.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                access_granted: newAccess,
                admin_notes: adminNotes,
                granted_at: newAccess ? new Date().toISOString() : null,
                granted_by: newAccess ? 1 : null // TODO: Get actual admin ID from context
              }
            : u // Keep other users unchanged
        ))
        
        toast({
          title: "Success",
          description: `${newAccess ? 'Granted' : 'Revoked'} session access for ${user.name}. Changes saved to database.`,
        })
      } else {
        throw new Error(response.error || 'Failed to update access in database')
      }
      
    } catch (error) {
      console.error('Error updating access:', error)
      toast({
        title: "Database Error",
        description: `Failed to ${!user.access_granted ? 'grant' : 'revoke'} access. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleNotesUpdate = async (userId: number, notes: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      // Update admin notes in database
      const response = await adminApi.sessionAccess.grantAccess({
        userId,
        sessionId,
        accessGranted: user.access_granted || false,
        adminNotes: notes
      })

      if (response.success) {
        // Update ONLY the specific user's notes in local state
        setUsers(prevUsers => prevUsers.map(u => 
          u.id === userId 
            ? { ...u, admin_notes: notes }
            : u // Keep other users unchanged
        ))
        
        toast({
          title: "Notes Updated",
          description: "Admin notes saved to database.",
        })
      } else {
        throw new Error(response.error || 'Failed to update notes')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: "Failed to update admin notes.",
        variant: "destructive",
      })
    }
  }

  const getStats = () => {
    const granted = users.filter(u => u.access_granted === true).length
    const denied = users.filter(u => u.access_granted === false).length
    const pending = users.filter(u => u.access_granted === null).length
    return { granted, denied, pending, total: users.length }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Session Access Management</h1>
            <p className="text-muted-foreground">Loading users and access status for: {sessionTitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users and their access permissions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Session Access Management</h1>
          <p className="text-muted-foreground">Manage database-persisted access for: {sessionTitle}</p>
        </div>
      </div>

      {/* Database Connection Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-green-800">Database Connected</p>
            <p className="text-xs text-green-600 ml-2">
              All access changes are saved to the user_session_access table and persist after refresh
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Access Granted</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.granted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Access Denied</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, field, etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing: {filteredUsers.length} of {users.length} users
        </div>
        {searchTerm && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Database-Persisted Session Access Control</CardTitle>
          <p className="text-sm text-muted-foreground">
            Grant or deny access to this session. All changes are saved to the database and will persist after refresh.
          </p>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">Education</th>
                    <th className="text-left p-3 font-semibold">Registration</th>
                    <th className="text-left p-3 font-semibold">Access Status</th>
                    <th className="text-left p-3 font-semibold">Admin Notes</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`border-b hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                      }`}
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          {user.preferred_name && (
                            <div className="text-xs text-muted-foreground">
                              Preferred: {user.preferred_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs font-mono">{user.email || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.phone || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.country || 'N/A'}{user.county ? `, ${user.county}` : ''}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs font-medium">
                            {user.field_of_study || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.institution || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.level_of_study || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs font-mono">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                          {user.signup_source && (
                            <div className="text-xs text-muted-foreground">
                              {user.signup_source}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <Badge 
                            variant={user.access_granted === true ? "default" : user.access_granted === false ? "destructive" : "secondary"}
                            className={`text-xs ${
                              user.access_granted === true
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : user.access_granted === false
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            {user.access_granted === true ? 'Access Granted' : user.access_granted === false ? 'Access Denied' : 'Pending Decision'}
                          </Badge>
                          {user.granted_at && (
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(user.granted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Textarea
                          placeholder="Add admin notes (saved to database)..."
                          value={user.admin_notes || ""}
                          onChange={(e) => {
                            // Update local state immediately for better UX
                            setUsers(prevUsers => prevUsers.map(u => 
                              u.id === user.id 
                                ? { ...u, admin_notes: e.target.value }
                                : u
                            ))
                          }}
                          onBlur={(e) => handleNotesUpdate(user.id, e.target.value)}
                          className="min-h-[60px] text-xs"
                          rows={2}
                        />
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant={user.access_granted === true ? "destructive" : "default"}
                          onClick={() => handleToggleAccess(user.id)}
                          disabled={processingUsers.has(user.id)}
                          className="text-xs"
                        >
                          {processingUsers.has(user.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : user.access_granted === true ? (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Revoke Access
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Grant Access
                            </>
                          )}
                        </Button>
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
  )
}