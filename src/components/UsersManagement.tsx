import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Calendar,
  Trophy,
  TrendingUp,
  Activity
} from "lucide-react";
import apiService from "@/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  county?: string;
  field_of_study: string;
  institution?: string;
  level_of_study: string;
  created_at: string;
  total_points?: number;
  level_name?: string;
  sessions_attended?: number;
  total_payments?: number;
  payments_count?: number;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterCountry, filterLevel]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Try Supabase first for enhanced data (shows ALL users including inactive)
      let response = await apiService.getAllUsersWithStatsFromSupabase();
      if (!response.success) {
        // Fallback to basic user data
        response = await apiService.getAllUsersFromSupabase();
      }
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        console.error('Failed to fetch users:', response.error);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.field_of_study.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCountry) {
      filtered = filtered.filter(user =>
        user.country.toLowerCase().includes(filterCountry.toLowerCase())
      );
    }

    if (filterLevel) {
      filtered = filtered.filter(user =>
        user.level_of_study.toLowerCase().includes(filterLevel.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLevelColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    switch (level.toLowerCase()) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'explorer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Country', 'Field of Study', 'Level', 'Points', 'Sessions', 'Joined'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.phone,
        user.country,
        user.field_of_study,
        user.level_name || 'N/A',
        user.total_points || 0,
        user.sessions_attended || 0,
        formatDate(user.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillyme-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueCountries = [...new Set(users.map(user => user.country))].sort();
  const uniqueLevels = [...new Set(users.map(user => user.level_of_study))].sort();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.sessions_attended && u.sessions_attended > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.total_points && u.total_points >= 500).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter(u => {
                    const userDate = new Date(u.created_at);
                    const now = new Date();
                    return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <Button onClick={exportUsers} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or field of study..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Levels</option>
              {uniqueLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching your criteria</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{user.name}</h4>
                      {user.level_name && (
                        <Badge className={getLevelColor(user.level_name)}>
                          {user.level_name}
                        </Badge>
                      )}
                      {user.total_points && user.total_points > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {user.total_points} pts
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{user.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        <span className="truncate">{user.field_of_study}</span>
                      </div>
                    </div>

                    {(user.sessions_attended || user.payments_count) && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {user.sessions_attended && (
                          <span>Sessions: {user.sessions_attended}</span>
                        )}
                        {user.payments_count && (
                          <span>Payments: {user.payments_count}</span>
                        )}
                        <span>Joined: {formatDate(user.created_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal (simplified for now) */}
      {selectedUser && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Details</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Field of Study</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.field_of_study}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Level of Study</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.level_of_study}</p>
                </div>
                {selectedUser.institution && (
                  <div>
                    <label className="text-sm font-medium">Institution</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.institution}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Joined</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>

              {(selectedUser.total_points || selectedUser.sessions_attended) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Activity Stats</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedUser.total_points && (
                      <div>
                        <label className="text-sm font-medium">Total Points</label>
                        <p className="text-lg font-bold text-primary">{selectedUser.total_points}</p>
                      </div>
                    )}
                    {selectedUser.sessions_attended && (
                      <div>
                        <label className="text-sm font-medium">Sessions Attended</label>
                        <p className="text-lg font-bold text-green-600">{selectedUser.sessions_attended}</p>
                      </div>
                    )}
                    {selectedUser.payments_count && (
                      <div>
                        <label className="text-sm font-medium">Payments Made</label>
                        <p className="text-lg font-bold text-blue-600">{selectedUser.payments_count}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsersManagement;