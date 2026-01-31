import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle, XCircle, Users, ArrowLeft } from "lucide-react"

// Import the apiRequest function directly
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import environment from '../../config/environment';

const API_BASE_URL = environment.apiConfig.baseURL;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Helper function to make API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: unknown) {
    console.error('❌ API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

interface User {
  user_id: number
  name: string
  email: string
  phone: string
  country: string
  county: string
  field_of_study: string
  access_granted: boolean | null
  admin_notes: string | null
  granted_at: string | null
  granted_by: number | null
}

interface SessionAccessManagerProps {
  sessionId: number
  sessionTitle: string
  onBack: () => void
}

export function SessionAccessManager({ sessionId, sessionTitle, onBack }: SessionAccessManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingUsers, setProcessingUsers] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Fetch users and their access status for this session
  useEffect(() => {
    fetchUsers()
  }, [sessionId])

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase()
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phone.includes(searchLower) ||
          user.country.toLowerCase().includes(searchLower) ||
          (user.county && user.county.toLowerCase().includes(searchLower)) ||
          (user.field_of_study && user.field_of_study.toLowerCase().includes(searchLower))
        )
      })
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/admin/session-access/session/${sessionId}/users`)
      
      if (response.success && response.data) {
        setUsers(response.data.users)
        setFilteredUsers(response.data.users)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAccess = async (userId: number, currentAccess: boolean | null, adminNotes: string = "") => {
    const newAccess = !currentAccess
    
    try {
      setProcessingUsers(prev => new Set(prev).add(userId))
      
      const response = await apiRequest('/admin/session-access/grant-access', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          sessionId,
          accessGranted: newAccess,
          adminNotes
        })
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Access ${newAccess ? 'granted' : 'revoked'} successfully`,
        })
        
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user.user_id === userId 
            ? { 
                ...user, 
                access_granted: newAccess,
                admin_notes: adminNotes,
                granted_at: newAccess ? new Date().toISOString() : null
              }
            : user
        ))
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update access",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating access:", error)
      toast({
        title: "Error",
        description: "Failed to update access",
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
    const user = users.find(u => u.user_id === userId)
    if (!user) return

    await handleToggleAccess(userId, user.access_granted, notes)
  }

  const getAccessStats = () => {
    const granted = users.filter(u => u.access_granted === true).length
    const pending = users.filter(u => u.access_granted === null || u.access_granted === false).length
    return { granted, pending, total: users.length }
  }

  const stats = getAccessStats()

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading users...</p>
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
          <p className="text-muted-foreground">Manage user access for: {sessionTitle}</p>
        </div>
      </div>

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
              <span className="text-sm font-medium">Access Pending</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Access Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.granted / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, phone..."
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
          <CardTitle>User Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">Location</th>
                    <th className="text-left p-3 font-semibold">Field of Study</th>
                    <th className="text-left p-3 font-semibold">Access Status</th>
                    <th className="text-left p-3 font-semibold">Admin Notes</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.user_id} 
                      className={`border-b hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                      }`}
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.user_id}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs">{user.country}</div>
                          {user.county && (
                            <div className="text-xs text-muted-foreground">{user.county}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs">
                          {user.field_of_study || <span className="text-muted-foreground italic">Not specified</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={user.access_granted ? "default" : "secondary"}
                          className={`text-xs ${
                            user.access_granted 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {user.access_granted ? 'Access Granted' : 'Access Pending'}
                        </Badge>
                        {user.granted_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(user.granted_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Textarea
                          placeholder="Add admin notes..."
                          value={user.admin_notes || ""}
                          onChange={(e) => {
                            // Update local state immediately for better UX
                            setUsers(prev => prev.map(u => 
                              u.user_id === user.user_id 
                                ? { ...u, admin_notes: e.target.value }
                                : u
                            ))
                          }}
                          onBlur={(e) => handleNotesUpdate(user.user_id, e.target.value)}
                          className="min-h-[60px] text-xs"
                          rows={2}
                        />
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant={user.access_granted ? "destructive" : "default"}
                          onClick={() => handleToggleAccess(user.user_id, user.access_granted)}
                          disabled={processingUsers.has(user.user_id)}
                          className="text-xs"
                        >
                          {processingUsers.has(user.user_id) ? (
                            "Processing..."
                          ) : user.access_granted ? (
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