import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminApi, User } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

export default function Users() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  // Users will be loaded from backend
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [fieldFilter, setFieldFilter] = useState("")
  const [institutionFilter, setInstitutionFilter] = useState("")

  // Load users from backend
  useEffect(() => {
    // Don't make API calls if not authenticated or still loading auth
    if (!isAuthenticated || authLoading) {
      setLoading(false)
      return
    }

    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Loading users with params:', {
          search: searchTerm || undefined,
          field_of_study: fieldFilter || undefined,
          institution: institutionFilter || undefined,
        })

        const response = await adminApi.users.getAllUsers({
          search: searchTerm || undefined,
          field_of_study: fieldFilter || undefined,
          institution: institutionFilter || undefined,
        })
        
        console.log('📊 Users API response:', response)
        
        if (response && response.success && response.data && response.data.users) {
          console.log('✅ Users loaded successfully:', response.data.users.length, 'users')
          setUsers(response.data.users)
        } else {
          console.error('❌ Users API failed:', response?.error || response?.message || 'Invalid response format')
          setError(response?.error || response?.message || 'Failed to load users - invalid response')
        }
      } catch (err) {
        console.error('❌ Failed to load users:', err)
        setError(err instanceof Error ? err.message : 'Network error - failed to load users')
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure auth is fully loaded
    const timeoutId = setTimeout(loadUsers, 100)
    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, authLoading])

  // Handle search/filter changes
  useEffect(() => {
    if (!isAuthenticated || authLoading || loading) {
      return
    }

    const delayedSearch = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await adminApi.users.getAllUsers({
          search: searchTerm || undefined,
          field_of_study: fieldFilter || undefined,
          institution: institutionFilter || undefined,
        })
        
        if (response && response.success && response.data && response.data.users) {
          setUsers(response.data.users)
        } else {
          setError('Failed to filter users')
        }
      } catch (err) {
        console.error('Filter error:', err)
        setError('Failed to filter users')
      } finally {
        setLoading(false)
      }
    }, 500) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, fieldFilter, institutionFilter, isAuthenticated, authLoading])

  // Handle user actions
  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await adminApi.users.toggleUserStatus(userId, isActive)
      if (response.success) {
        // Reload users
        const usersResponse = await adminApi.users.getAllUsers()
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data.users)
        }
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err)
    }
  }

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Authentication required</p>
            <p className="text-muted-foreground">Please log in to access this page</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage registered users</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="font-medium">Error loading users:</div>
            <div className="text-sm mt-1">{error}</div>
            <div className="text-xs mt-2 text-red-600">
              Check the browser console for more details. Try refreshing the page.
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Field of Study" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Fields</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Business Administration">Business Administration</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
            </SelectContent>
          </Select>
          <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Institution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Institutions</SelectItem>
              <SelectItem value="University of Nairobi">University of Nairobi</SelectItem>
              <SelectItem value="Kenyatta University">Kenyatta University</SelectItem>
              <SelectItem value="JKUAT">JKUAT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Field of Study</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading users from backend...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.field_of_study}</TableCell>
                  <TableCell>{user.institution}</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem>Send Email</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleToggleUserStatus(user.id, false)}
                        >
                          Suspend Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
