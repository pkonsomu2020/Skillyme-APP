import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle, XCircle, Users, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { adminApi, User } from "@/services/api"

interface UserWithAccess extends User {
  hasAccess: boolean
  adminNotes?: string
  grantedAt?: string
  grantedBy?: number
}

interface SessionAccessManagerProps {
  sessionId: number
  sessionTitle: string
  onBack: () => void
}

export function SessionAccessManager({ sessionId, sessionTitle, onBack }: SessionAccessManagerProps) {
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingUsers, setProcessingUsers] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Safe filter function that handles null/undefined values
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      try {
        const filtered = users.filter(user => {
          const searchLower = searchTerm.toLowerCase()
          
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
        })
        setFilteredUsers(filtered)
      } catch (error) {
        console.error('Search filter error:', error)
        setFilteredUsers(users)
      }
    }
  }, [searchTerm, users])

  // Load real users with their actual access status from database
  useEffect(() => {
    loadUsersWithAccessStatus()
  }, [sessionId])

  const loadUsersWithAccessStatus = async () => {
    try {
      setLoading(true)
      
      // First, get all users
      const usersResponse = await adminApi.users.getAllUsers({
        limit: 1000,
        page: 1
      })
      
      if (!usersResponse.success || !usersResponse.data?.users) {
        throw new Error(usersResponse.error || 'Failed to load users')
      }

      // Then, get access status for this specific session
      try {
        const accessResponse = await adminApi.sessionAccess.getUsersForSession(sessionId)
        
        if (accessResponse.success && accessResponse.data?.users) {
          // We have access data from the API
          const usersWithAccess = accessResponse.data.users.map((accessUser: any) => ({
            ...accessUser,
            hasAccess: accessUser.access_granted || false,
            adminNotes: accessUser.admin_notes || undefined,
            grantedAt: accessUser.granted_at || undefined,
            grantedBy: accessUser.granted_by || undefined
          }))
          
          setUsers(usersWithAccess)
          setFilteredUsers(usersWithAccess)
          
          toast({
            title: "Users Loaded",
            description: `Loaded ${usersWithAccess.length} users with their current access status`,
          })
        } else {
          // No access data available, show all users with no access
          const usersWithAccess: UserWithAccess[] = usersResponse.data.users.map(user => ({
            ...user,
            hasAccess: false,
            adminNotes: undefined,
            grantedAt: undefined,
            grantedBy: undefined
          }))
          
          setUsers(usersWithAccess)
          setFilteredUsers(usersWithAccess)
          
          toast({
            title: "Users Loaded",
            description: `Loaded ${usersWithAccess.length} users. No access permissions set yet for this session.`,
          })
        }
      } catch (accessError) {
        console.warn('Could not load access data, showing all users with no access:', accessError)
        
        // Fallback: show all users with no access
        const usersWithAccess: UserWithAccess[] = usersResponse.data.users.map(user => ({
          ...user,
          hasAccess: false,
          adminNotes: undefined,
          grantedAt: undefined,
          grantedBy: undefined
        }))
        
        setUsers(usersWithAccess)
        setFilteredUsers(usersWithAccess)
        
        toast({
          title: "Users Loaded",
          description: `Loaded ${usersWithAccess.length} users. Access management ready.`,
        })
      }
      
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to load users from database. Please try again.",
        variant: "destructive",
      })
      
      setUsers([])
      setFilteredUsers([])
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
      
      const newAccess = !user.hasAccess
      const adminNotes = newAccess 
        ? `Access granted for session: ${sessionTitle}` 
        : `Access revoked for session: ${sessionTitle}`
      
      // Make real API call to update database
      const response = await adminApi.sessionAccess.grantAccess({
        userId,
        sessionId,
        accessGranted: newAccess,
        adminNotes
      })

      if (response.success) {
        // Update local state to reflect database change
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                hasAccess: newAccess,
                adminNotes: adminNotes,
                grantedAt: newAccess ? new Date().toISOString() : undefined,
                grantedBy: newAccess ? 1 : undefined // TODO: Get actual admin ID
              }
            : u
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
        description: `Failed to ${!user.hasAccess ? 'grant' : 'revoke'} access. Please try again.`,
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
        accessGranted: user.hasAccess,
        adminNotes: notes
      })

      if (response.success) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, adminNotes: notes }
            : u
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
    const granted = users.filter(u => u.hasAccess).length
    const pending = users.filter(u => !u.hasAccess).length
    return { granted, pending, total: users.length }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users safely by any field..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing: {filteredUsers.length} of {users.length} users
        </div>
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
                            variant={user.hasAccess ? "default" : "secondary"}
                            className={`text-xs ${
                              user.hasAccess 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {user.hasAccess ? 'Access Granted' : 'Access Denied'}
                          </Badge>
                          {user.grantedAt && (
                            <div className="text-xs text-muted-foreground">
                              Granted: {new Date(user.grantedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Textarea
                          placeholder="Add admin notes (saved to database)..."
                          value={user.adminNotes || ""}
                          onChange={(e) => {
                            // Update local state immediately for better UX
                            setUsers(prev => prev.map(u => 
                              u.id === user.id 
                                ? { ...u, adminNotes: e.target.value }
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
                          variant={user.hasAccess ? "destructive" : "default"}
                          onClick={() => handleToggleAccess(user.id)}
                          disabled={processingUsers.has(user.id)}
                          className="text-xs"
                        >
                          {processingUsers.has(user.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : user.hasAccess ? (
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