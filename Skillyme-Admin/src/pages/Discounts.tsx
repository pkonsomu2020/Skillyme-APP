import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Trophy, 
  Gift, 
  Users, 
  Award, 
  Mail, 
  CheckCircle, 
  Star,
  Target,
  TrendingUp
} from "lucide-react"
import { adminApi } from "@/services/api"

interface LeaderboardUser {
  user_id: number
  total_points: number
  available_points: number
  level_name: string
  users: {
    name: string
    email: string
    field_of_study: string
    level_of_study: string
  }
  assignment_stats: {
    total_submissions: number
    approved_submissions: number
    total_points_earned: number
    average_points_per_assignment: number
    recent_submissions: any[]
  }
  discount_eligibility: {
    is_eligible: boolean
    points_requirement: number
    assignments_requirement: number
    points_per_assignment_requirement: number
    high_points_threshold: number
    meets_points: boolean
    meets_assignments: boolean
    meets_points_per_assignment: boolean
    has_high_points: boolean
    eligibility_reason: string
  }
  existing_discounts: any[]
}

interface Discount {
  id: number
  user_id: number
  discount_percentage: number
  discount_type: string
  status: string
  awarded_at: string
  reason: string
  users: {
    name: string
    email: string
  }
}

export default function Discounts() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState<number | null>(null)
  const [bulkAwarding, setBulkAwarding] = useState(false)
  const [minPoints, setMinPoints] = useState(10)
  const [discountPercentage, setDiscountPercentage] = useState(20)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'discounts'>('leaderboard')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  // Fetch leaderboard data for discounts
  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await adminApi.discounts.getLeaderboard({
        limit: 200, // Increased to show all users (120+)
        min_points: minPoints
      })
      
      if (response.success) {
        setLeaderboard(response.data.leaderboard)
      } else {
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch existing discounts
  const fetchDiscounts = async () => {
    try {
      const response = await adminApi.discounts.getAll({
        limit: 200, // Increased to show all discounts
        page: 1
      })
      
      if (response.success) {
        setDiscounts(response.data.discounts)
      }
    } catch (error) {
      console.error("Error fetching discounts:", error)
    }
  }

  // Award discount to individual user
  const awardDiscount = async (userId: number, userPoints: number) => {
    try {
      setAwarding(userId)
      const response = await adminApi.discounts.award({
        user_id: userId,
        discount_percentage: discountPercentage,
        discount_type: 'next_phase',
        reason: `Top performer with ${userPoints} points - Leaderboard achievement`
      })
      
      if (response.success) {
        toast({
          title: "Discount Awarded!",
          description: `${discountPercentage}% discount awarded successfully. Email sent to user.`,
        })
        await fetchLeaderboard()
        await fetchDiscounts()
      } else {
        toast({
          title: "Award Failed",
          description: response.error || "Failed to award discount",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error awarding discount:", error)
      toast({
        title: "Error",
        description: "Failed to award discount",
        variant: "destructive",
      })
    } finally {
      setAwarding(null)
    }
  }

  // Bulk award discounts to top performers
  const bulkAwardDiscounts = async () => {
    try {
      setBulkAwarding(true)
      const eligibleUsers = leaderboard.filter(user => user.discount_eligibility.is_eligible)
      
      if (eligibleUsers.length === 0) {
        toast({
          title: "No Eligible Users",
          description: "No users meet the criteria for discount awards",
          variant: "destructive",
        })
        return
      }

      const response = await adminApi.discounts.bulkAward({
        top_count: eligibleUsers.length,
        discount_percentage: discountPercentage,
        min_points: minPoints,
        reason: `Bulk award for top ${eligibleUsers.length} performers`
      })
      
      if (response.success) {
        toast({
          title: "Bulk Award Complete!",
          description: `Awarded discounts to ${response.data.summary.successful} users. Emails sent automatically.`,
        })
        await fetchLeaderboard()
        await fetchDiscounts()
      } else {
        toast({
          title: "Bulk Award Failed",
          description: response.error || "Failed to award bulk discounts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error bulk awarding:", error)
      toast({
        title: "Error",
        description: "Failed to bulk award discounts",
        variant: "destructive",
      })
    } finally {
      setBulkAwarding(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    fetchDiscounts()
  }, [minPoints])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing discounts data...')
      fetchLeaderboard()
      fetchDiscounts()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, minPoints])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      used: "secondary",
      expired: "destructive",
      revoked: "outline"
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  const getEligibilityBadge = (user: LeaderboardUser) => {
    if (user.discount_eligibility.is_eligible) {
      return <Badge className="bg-green-100 text-green-800">✅ Eligible</Badge>
    }
    return <Badge variant="outline">❌ Not Eligible</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading discount management...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const eligibleCount = leaderboard.filter(user => user.discount_eligibility.is_eligible).length

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              Discount Management
            </h1>
            <p className="text-muted-foreground">Award discounts to top-performing students based on leaderboard rankings</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200 text-green-700' : ''}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchLeaderboard()
                  fetchDiscounts()
                  toast({
                    title: "Refreshed",
                    description: "User data updated successfully",
                  })
                }}
              >
                🔄 Refresh Now
              </Button>
            </div>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
            <Button
              variant={activeTab === 'discounts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('discounts')}
            >
              <Award className="mr-2 h-4 w-4" />
              Awarded Discounts
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Eligible for Discount</p>
                  <p className="text-2xl font-bold text-green-600">{eligibleCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gift className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Discounts</p>
                  <p className="text-2xl font-bold">{discounts.filter(d => d.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg Discount</p>
                  <p className="text-2xl font-bold">{discountPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeTab === 'leaderboard' && (
          <>
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Award Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Minimum Points Required</label>
                    <Input
                      type="number"
                      value={minPoints}
                      onChange={(e) => setMinPoints(parseInt(e.target.value) || 10)}
                      className="w-40"
                      min="1"
                      placeholder="Enter minimum points"
                    />
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinPoints(10)}
                        className={`text-xs h-6 px-2 ${minPoints === 10 ? 'bg-primary text-white' : ''}`}
                      >
                        10
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinPoints(50)}
                        className={`text-xs h-6 px-2 ${minPoints === 50 ? 'bg-primary text-white' : ''}`}
                      >
                        50
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinPoints(100)}
                        className={`text-xs h-6 px-2 ${minPoints === 100 ? 'bg-primary text-white' : ''}`}
                      >
                        100
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinPoints(250)}
                        className={`text-xs h-6 px-2 ${minPoints === 250 ? 'bg-primary text-white' : ''}`}
                      >
                        250
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Discount Percentage</label>
                    <Input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 20)}
                      className="w-32"
                      min="1"
                      max="100"
                      placeholder="20"
                    />
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountPercentage(10)}
                        className={`text-xs h-6 px-2 ${discountPercentage === 10 ? 'bg-primary text-white' : ''}`}
                      >
                        10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountPercentage(15)}
                        className={`text-xs h-6 px-2 ${discountPercentage === 15 ? 'bg-primary text-white' : ''}`}
                      >
                        15%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountPercentage(20)}
                        className={`text-xs h-6 px-2 ${discountPercentage === 20 ? 'bg-primary text-white' : ''}`}
                      >
                        20%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountPercentage(25)}
                        className={`text-xs h-6 px-2 ${discountPercentage === 25 ? 'bg-primary text-white' : ''}`}
                      >
                        25%
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={bulkAwardDiscounts}
                    disabled={bulkAwarding || eligibleCount === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {bulkAwarding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Awarding...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Award to All Eligible ({eligibleCount})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers - Discount Eligibility</CardTitle>
                <p className="text-sm text-muted-foreground">
                  <strong>Eligibility Criteria:</strong> ≥{minPoints} points + (≥100 total points OR good assignment performance ≥15 pts avg)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 High performers (≥100 points) qualify automatically. Others need good assignment scores (≥15 pts avg)
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.user_id}
                      className={`p-4 border rounded-lg ${
                        user.discount_eligibility.is_eligible 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.users.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.users.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.users.field_of_study} • {user.users.level_of_study}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-bold">{user.total_points} pts</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.assignment_stats.approved_submissions} assignments • 
                              {user.assignment_stats.average_points_per_assignment.toFixed(1)} pts avg
                            </div>
                          </div>
                          
                          {getEligibilityBadge(user)}
                          
                          {user.existing_discounts.length > 0 ? (
                            <Badge variant="secondary">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Has Discount
                            </Badge>
                          ) : user.discount_eligibility.is_eligible ? (
                            <Button
                              size="sm"
                              onClick={() => awardDiscount(user.user_id, user.total_points)}
                              disabled={awarding === user.user_id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {awarding === user.user_id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Awarding...
                                </>
                              ) : (
                                <>
                                  <Gift className="mr-1 h-3 w-3" />
                                  Award {discountPercentage}%
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              {user.discount_eligibility.eligibility_reason || 
                               `Need: ${!user.discount_eligibility.meets_points ? 'More points' : 
                                       user.discount_eligibility.has_high_points ? 'Already qualified!' : 
                                       'Complete assignments or reach 100+ points'}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'discounts' && (
          <Card>
            <CardHeader>
              <CardTitle>Awarded Discounts</CardTitle>
              <p className="text-sm text-muted-foreground">
                All discounts awarded to users with their current status
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discounts.map((discount) => (
                  <div key={discount.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{discount.users.name}</h3>
                        <p className="text-sm text-muted-foreground">{discount.users.email}</p>
                        <p className="text-sm text-muted-foreground">{discount.reason}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">{discount.discount_percentage}%</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(discount.awarded_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {getStatusBadge(discount.status)}
                        
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
                
                {discounts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No discounts awarded yet. Start by awarding discounts to top performers!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}