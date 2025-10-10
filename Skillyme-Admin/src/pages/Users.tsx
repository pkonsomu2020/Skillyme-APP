import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, UserPlus, Mail, Phone, Calendar, MapPin } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const { toast } = useToast()

  // Fetch users data using the API service
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await adminApi.users.getAllUsers()
      
      if (response.success && response.data?.users) {
        // Transform the API data to match our component interface
        const transformedUsers: UserWithStats[] = response.data.users.map(user => ({
          ...user,
          status: 'active' as const, // Default status since it's not in the API
          totalBookings: 0, // This would need to come from a separate endpoint
          lastActivity: user.created_at, // Use created_at as placeholder
          joinDate: user.created_at,
          location: user.county || user.country,
        }))
        
        setUsers(transformedUsers)
        setFilteredUsers(transformedUsers)
      } else {
        console.warn("Unexpected API response format:", response)
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
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users data",
        variant: "destructive",
      })
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }, [toast])

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
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {users.length}</span>
            <span>Showing: {filteredUsers.length}</span>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  
                  {user.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                  
                  {user.field_of_study && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Field:</span>
                      <span className="truncate">{user.field_of_study}</span>
                    </div>
                  )}
                  
                  {user.institution && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Institution:</span>
                      <span className="truncate">{user.institution}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Bookings:</span>
                      <span className="font-semibold">{user.totalBookings}</span>
                    </div>
                    {user.lastActivity && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Last Active:</span>
                        <span className="text-xs">{formatDate(user.lastActivity)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}