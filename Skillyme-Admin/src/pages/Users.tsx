import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, UserPlus } from "lucide-react"
import { adminApi, User } from "@/services/api"

interface UserWithStats extends User {
  status: 'active' | 'inactive' | 'pending'
  totalBookings: number
  lastActivity?: string
  location?: string
}

export default function Users() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  // Fetch users data using the API service
  const fetchUsers = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not during auto-sync
      if (users.length === 0) {
        setLoading(true)
      } else {
        setSyncing(true)
      }
      
      const response = await adminApi.users.getAllUsers()
      
      if (response.success && response.data?.users) {
        // Transform the API data to match our component interface
        const transformedUsers: UserWithStats[] = response.data.users.map(user => ({
          ...user,
          status: 'active' as const, // Default status since it's not in the API
          totalBookings: 0, // This would need to come from a separate endpoint
          lastActivity: user.updated_at || user.created_at, // Use updated_at if available
          location: user.county || user.country,
        }))
        
        setUsers(transformedUsers)
        setFilteredUsers(transformedUsers)
        setLastUpdated(new Date())
      } else {
        console.warn("Unexpected API response format:", response)
        
        // Only show error toast on initial load, not during auto-sync
        if (users.length === 0) {
          setUsers([])
          setFilteredUsers([])
          
          if (!response.success) {
            toast({
              title: "Error",
              description: response.error || "Failed to load users data",
              variant: "destructive",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      
      // Only show error toast on initial load, not during auto-sync
      if (users.length === 0) {
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        })
        setUsers([])
        setFilteredUsers([])
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [toast, users.length])

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.field_of_study && user.field_of_study.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.institution && user.institution.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Auto-sync users data every 10 seconds from Supabase database
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers()
    }, 10000) // Sync every 10 seconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval)
    }
  }, [fetchUsers])

  // Cleanup test users function
  const handleCleanupTestUsers = async () => {
    if (!confirm('Are you sure you want to delete all test users? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const response = await adminApi.users.cleanupTestUsers()
      
      if (response.success) {
        toast({
          title: "Cleanup Successful",
          description: `Deleted ${response.data?.deletedCount || 0} test users`,
        })
        // Refresh the users list
        await fetchUsers()
      } else {
        toast({
          title: "Cleanup Failed",
          description: response.error || "Failed to cleanup test users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cleanup error:", error)
      toast({
        title: "Error",
        description: "Failed to cleanup test users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading users...</p>
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
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage and view all registered users</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCleanupTestUsers}
              className="text-red-600 hover:text-red-700"
            >
              🧹 Cleanup Test Users
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, field, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {users.length}</span>
            <span>Showing: {filteredUsers.length}</span>
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-green-500'}`}></div>
                {syncing ? 'Syncing...' : `Last synced: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            )}
          </div>
        </div>

        {/* Professional Data Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Registered Users Database</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete user registration data from Supabase database
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
                {syncing ? 'Syncing...' : 'Auto-sync every 10 seconds'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No users found' : 'No users yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Users will appear here once they register'
                  }
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">ID</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Name</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Email</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Phone</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Location</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Field of Study</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Institution</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Level</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Join Date</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Status</th>
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
                        <td className="p-4 font-mono text-sm font-medium">#{user.id}</td>
                        <td className="p-4 font-medium text-foreground">{user.name}</td>
                        <td className="p-4 text-sm text-muted-foreground font-mono">{user.email}</td>
                        <td className="p-4 text-sm font-mono">{user.phone || '—'}</td>
                        <td className="p-4 text-sm">{user.location || '—'}</td>
                        <td className="p-4 text-sm">
                          <span className={user.field_of_study && user.field_of_study !== 'Not specified' 
                            ? 'text-foreground' 
                            : 'text-muted-foreground italic'
                          }>
                            {user.field_of_study && user.field_of_study !== 'Not specified' 
                              ? user.field_of_study 
                              : 'Not specified'
                            }
                          </span>
                        </td>
                        <td className="p-4 text-sm">{user.institution || '—'}</td>
                        <td className="p-4 text-sm">{user.level_of_study || '—'}</td>
                        <td className="p-4 text-sm font-mono">{formatDate(user.created_at)}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(user.status)} variant="secondary">
                            {user.status}
                          </Badge>
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