import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Search, AlertTriangle, X } from "lucide-react"
import { adminApi } from "@/services/api"

interface SafeUser {
  id: number | string
  name: string
  email: string
  phone: string
  country: string
  county: string
  field_of_study: string
  institution: string
  level_of_study: string
  created_at: string
  preferred_name?: string
  course_of_study?: string
  degree?: string
  year_of_study?: string
  primary_field_interest?: string
  signup_source?: string
}

const safe = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'object') return ''
  return String(v).toLowerCase()
}

const fmt = (v: unknown): string => {
  if (!v) return 'N/A'
  try {
    const d = new Date(String(v))
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString('en-US', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric', month: 'short', day: 'numeric'
    })
  } catch {
    return String(v)
  }
}

const normalize = (raw: unknown): SafeUser => {
  const u = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    id: (u.id as number) ?? 0,
    name: String(u.name ?? ''),
    email: String(u.email ?? ''),
    phone: String(u.phone ?? ''),
    country: String(u.country ?? ''),
    county: String(u.county ?? ''),
    field_of_study: String(u.field_of_study ?? ''),
    institution: String(u.institution ?? ''),
    level_of_study: String(u.level_of_study ?? ''),
    created_at: String(u.created_at ?? ''),
    preferred_name: u.preferred_name ? String(u.preferred_name) : undefined,
    course_of_study: u.course_of_study ? String(u.course_of_study) : undefined,
    degree: u.degree ? String(u.degree) : undefined,
    year_of_study: u.year_of_study ? String(u.year_of_study) : undefined,
    primary_field_interest: u.primary_field_interest ? String(u.primary_field_interest) : undefined,
    signup_source: u.signup_source ? String(u.signup_source) : undefined,
  }
}

export default function Users() {
  const [users, setUsers] = useState<SafeUser[]>([])
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
        const rawUsers = response.data?.users
        setUsers(Array.isArray(rawUsers) ? rawUsers.map(normalize) : [])
        setLastUpdated(new Date())
      } else {
        const msg = response.error || "Failed to load users"
        if (!isBackground) {
          setFetchError(msg)
          toast({ title: "Error", description: msg, variant: "destructive" })
        }
      }
    } catch (error) {
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

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchUsers(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchUsers(true), 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const term = searchTerm.trim().toLowerCase()
  const filteredUsers = term
    ? users.filter(u =>
        safe(u.id).includes(term) ||
        safe(u.name).includes(term) ||
        safe(u.email).includes(term) ||
        safe(u.phone).includes(term) ||
        safe(u.country).includes(term) ||
        safe(u.county).includes(term) ||
        safe(u.field_of_study).includes(term) ||
        safe(u.institution).includes(term) ||
        safe(u.level_of_study).includes(term) ||
        safe(u.preferred_name).includes(term) ||
        safe(u.course_of_study).includes(term) ||
        safe(u.degree).includes(term) ||
        safe(u.year_of_study).includes(term) ||
        safe(u.primary_field_interest).includes(term) ||
        safe(u.signup_source).includes(term)
      )
    : users

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage and view all registered users</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                  {searchTerm ? 'Try different search terms' : 'Users will appear here once they register'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {['ID','Name','Email','Phone','Country','County','Field of Study','Institution','Level','Joined'].map(h => (
                        <th key={h} className="text-left p-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => (
                      <tr
                        key={`${u.id}-${index}`}
                        className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/5'}`}
                      >
                        <td className="p-3 font-mono text-xs">{u.id || '—'}</td>
                        <td className="p-3 font-medium whitespace-nowrap">{u.name || '—'}</td>
                        <td className="p-3 font-mono text-xs">{u.email || '—'}</td>
                        <td className="p-3 font-mono text-xs">{u.phone || '—'}</td>
                        <td className="p-3">{u.country || '—'}</td>
                        <td className="p-3">{u.county || '—'}</td>
                        <td className="p-3">{u.field_of_study || '—'}</td>
                        <td className="p-3">{u.institution || '—'}</td>
                        <td className="p-3">{u.level_of_study || '—'}</td>
                        <td className="p-3 font-mono text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
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
