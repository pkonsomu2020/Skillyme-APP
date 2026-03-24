import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDate as eatFormatDate } from "@/lib/dateUtils"
import { Search, AlertTriangle } from "lucide-react"
import { adminApi, User } from "@/services/api"

// Safely convert any value to lowercase string for searching
const safe = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'object') return ''
  return String(v).toLowerCase()
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { toast } = useToast()
  const initialLoadDone = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setSyncing(true)
      setFetchError(null)

      const response = await adminApi.users.getAllUsers({ limit: 1000, page: 1 })

      if (response.success) {
        // Guard: ensure we always set an array
        const rawUsers = response.data?.users
        const safeUsers = Array.isArray(rawUsers) ? rawUsers : []
        setUsers(safeUsers)
        setLastUpdated(new Date())
      } else {
        const msg = response.error || "Failed to load users"
        if (!isBackground) {
          setFetchError(msg)
          toast({ title: "Error", description: msg, variant: "destructive" })
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      const msg = error instanceof Error ? error.message : "Failed to load users"
      if (!isBackground) {
        setFetchError(msg)
        toast({ title: "Error", description: msg, variant: "destructive" })
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  // Initial load — fires once
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchUsers(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Background auto-sync every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchUsers(true), 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute filtered list — always safe because users is always an array
  const term = searchTerm.trim().toLowerCase()
  const filteredUsers = term
    ? users.filter(user =>
        safe(user.id).includes(term) ||
        safe(user.name).includes(term) ||
        safe(user.email).includes(term) ||
        safe(user.phone).includes(term) ||
        safe(user.country).includes(term) ||
        safe(user.county).includes(term) ||
        safe(user.field_of_study).includes(term) ||
        safe(user.institution).includes(term) ||
        safe(user.level_of_study).includes(term) ||
        safe(user.preferred_name).includes(term) ||
        safe(user.course_of_study).includes(term) ||
        safe(user.degree).includes(term) ||
        safe(user.year_of_study).includes(term) ||
        safe(user.primary_field_interest).includes(term) ||
        safe(user.signup_source).includes(term)
      )
    : users

  const fmt = (v: string | null | undefined): string => {
    if (!v) return 'N/A'
    try { return eatFormatDate(v) } catch { return String(v) }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (fetchError && users.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Failed to load users</h3>
            <p className="text-muted-foreground text-sm max-w-sm">{fetchError}</p>
            <Button onClick={() => fetchUsers(false)}>Retry</Button>
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
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, institution..."
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
                <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                {syncing ? 'Syncing...' : `Updated: ${fmt(lastUpdated.toISOString())}`}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Registered Users</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">All users from the database</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                {syncing ? 'Syncing...' : 'Live'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No users found' : 'No users yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try different search terms'
                    : 'Users will appear here once they register'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {['ID','Name','Email','Phone','Country','County','Field of Study','Institution','Level','Joined'].map(h => (
                        <th
                          key={h}
                          className="text-left p-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id ?? index}
                        className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/5'}`}
                      >
                        <td className="p-3 font-mono text-xs">{user.id ?? '—'}</td>
                        <td className="p-3 font-medium whitespace-nowrap">{user.name || '—'}</td>
                        <td className="p-3 font-mono text-xs">{user.email || '—'}</td>
                        <td className="p-3 font-mono text-xs">{user.phone || '—'}</td>
                        <td className="p-3">{user.country || '—'}</td>
                        <td className="p-3">{user.county || '—'}</td>
                        <td className="p-3">{user.field_of_study || '—'}</td>
                        <td className="p-3">{user.institution || '—'}</td>
                        <td className="p-3">{user.level_of_study || '—'}</td>
                        <td className="p-3 font-mono text-xs whitespace-nowrap">{fmt(user.created_at)}</td>
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
