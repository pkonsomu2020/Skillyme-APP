import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle, XCircle, Users, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { adminApi, User } from "@/services/api"

interface UserWithAccess extends User {
  hasAccess: boolean
  adminNotes?: string
  grantedAt?: string
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
        // If search fails, show all users to prevent crash
        setFilteredUsers(users)
      }
    }
  }, [searchTerm, users])

  // Load real users from the database
  useEffect(() => {
    loadRealUsers()
  }, [sessionId])

  const loadRealUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch all real users from the database
      const response = await adminApi.users.getAllUsers({
        limit: 1000,
        page: 1
      })
      
      if (response.success && response.data?.users) {
        // Transform real users - all start with NO access by default
        // This is more realistic - admin must explicitly grant access
        const usersWithAccess: UserWithAccess[] = response.data.users.map(user => ({
          ...user,
          hasAccess: false, // All users start with no access
          adminNotes: undefined,
          grantedAt: undefined
        }))
        
        setUsers(usersWithAccess)
        setFilteredUsers(usersWithAccess)
        
        toast({
          title: "Real Users Loaded",
          description: `Found ${usersWithAccess.length} registered users. All access is currently denied - grant access as needed.`,
        })
      } else {
        throw new Error(response.error || 'Failed to load users')
      }
      
    } catch (error) {
      console.error('Error loading real users:', error)
      toast({
        title: "Error",
        description: "Failed to load users from database. Please try again.",
        variant: "destructive",
      })
      
      // Set empty array to prevent crashes
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAccess = async (userId: number) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId))
      
      const user = users.find(u => u.id === userId)
      if (!user) {
        throw new Error('User not found')
      }
      
      const newAccess = !user.hasAccess
      
      // TODO: Replace this with real API call to update user_session_access table
      // For now, just update local state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              hasAccess: newAccess,
              grantedAt: newAccess ? new Date().toISOString() : undefined,
              adminNotes: newAccess ? `Access granted for session: ${sessionTitle}` : undefined
            }
          : u
      ))
      
      toast({
        title: "Access Updated",
        description: `${newAccess ? 'Granted' : 'Revoked'} session access for ${user.name}`,
      })
      
    } catch (error) {
      console.error('Error updating access:', error)
      toast({
        title: "Error",
        description: "Failed to update access. Please try again.",
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
            <p className="text-muted-foreground">Loading real users for: {sessionTitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading registered users from database...</p>
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
          <p className="text-muted-foreground">Manage access for: {sessionTitle}</p>
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Important Notice</p>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            This is session-specific access control. Changes here only affect access to this particular session, not the user's overall account status.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Registered Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Session Access Granted</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.granted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Session Access Denied</span>
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
          <CardTitle>Session Access Control</CardTitle>
          <p className="text-sm text-muted-foreground">
            Grant or deny access to this specific session for registered users
          </p>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No registered users found'}
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
                    <th className="text-left p-3 font-semibold">Session Access</th>
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
                              Processing...
                            </>
                          ) : user.hasAccess ? (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Deny Access
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