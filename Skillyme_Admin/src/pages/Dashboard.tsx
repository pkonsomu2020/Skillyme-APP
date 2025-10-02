import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, DollarSign, Settings } from "lucide-react";

interface Payment {
  payment_id: number;
  user_name: string;
  user_email: string;
  mpesa_code: string;
  amount: string | number;
  actual_amount: string | number;
  amount_mismatch: boolean;
  status: 'pending' | 'paid' | 'failed' | 'amount_mismatch';
  submission_date: string;
  session_title: string;
  full_mpesa_message: string;
}

const Dashboard = () => {
  const { logout, isAuthenticated, adminToken, validateToken, isInitialized } = useAuth();
  
  // Authentication state is managed by AuthContext
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousPaymentCount, setPreviousPaymentCount] = useState(0);
  const [newPaymentsDetected, setNewPaymentsDetected] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Fetch payments from backend
  const fetchPayments = useCallback(async (isAutoRefresh = false) => {
    console.log(`🔄 fetchPayments called - isAutoRefresh: ${isAutoRefresh}`);
    
    // Debounce: Prevent excessive API calls (minimum 2 seconds between calls)
    const now = Date.now();
    if (isAutoRefresh && now - lastFetchTime < 2000) {
      console.log('🔄 fetchPayments skipped - debounced');
      return;
    }
    setLastFetchTime(now);

    // Validate token before making API call
    const isValidToken = await validateToken();
    if (!isValidToken) {
      console.log('🔄 fetchPayments skipped - invalid token');
      if (!isAutoRefresh) {
        setLoading(false);
        setError('Session expired. Please login again.');
      }
      return;
    }

    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
        console.log('🔄 Auto-refresh: fetching payments...');
      } else {
        setError(null);
        console.log('🔄 Manual refresh: fetching payments...');
      }

      const apiUrl = `${import.meta.env.VITE_API_URL || 'https://skillyme-backend-s3sy.onrender.com/api'}/admin/payments?t=${Date.now()}`;
      console.log('🔄 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        if (!isAutoRefresh) {
          setError('Session expired. Please login again.');
          logout();
        }
        return;
      }

      const data = await response.json();
      console.log('🔄 API Response:', data);

      if (data.success) {
        // Payments data received
        const newPayments = data.data.payments;
        console.log(`🔄 Received ${newPayments.length} payments (previous: ${previousPaymentCount})`);
        
        // Detect new payments
        if (isAutoRefresh && newPayments.length > previousPaymentCount) {
          console.log(`🔄 New payments detected: ${newPayments.length - previousPaymentCount}`);
          setNewPaymentsDetected(true);
          toast({
            title: "New Payment Detected!",
            description: `${newPayments.length - previousPaymentCount} new payment(s) received`,
            duration: 3000,
          });
          
          // Clear notification after 3 seconds
          setTimeout(() => setNewPaymentsDetected(false), 3000);
        }
        
        setPayments(newPayments);
        setPreviousPaymentCount(newPayments.length);
        setLastRefresh(new Date());
        console.log('🔄 Payments updated successfully');
      } else {
        console.error('🔄 API Error:', data.message);
        if (!isAutoRefresh) {
          setError(data.message || 'Failed to fetch payments.');
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching payments:', err);
      if (!isAutoRefresh) {
        setError('Failed to connect to the backend or an unexpected error occurred.');
      }
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, adminToken, validateToken, logout, previousPaymentCount, toast]);

  // Initial fetch
  useEffect(() => {
    if (!isInitialized) return;
    fetchPayments(false);
  }, [isInitialized, fetchPayments]);

  // Auto-refresh every 30 seconds (optimized for performance)
  useEffect(() => {
    if (!isAuthenticated || !adminToken || !autoRefresh) return;

    console.log('🔄 Auto-refresh enabled, setting up interval...');

    const interval = setInterval(() => {
      // Only refresh if the page is visible (not minimized or in background)
      if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refresh triggered');
        fetchPayments(true);
      } else {
        console.log('🔄 Auto-refresh skipped - page not visible');
      }
    }, 5000); // Refresh every 5 seconds (as it was working before)

    return () => {
      console.log('🔄 Auto-refresh interval cleared');
      clearInterval(interval);
    };
  }, [isAuthenticated, adminToken, autoRefresh, fetchPayments]);

  // Resume auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoRefresh) {
        fetchPayments(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchPayments]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status);
    setReason("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedPayment) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/payments/${selectedPayment.payment_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: reason || null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state immediately for better UX
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.payment_id === selectedPayment.payment_id 
              ? { ...payment, status: newStatus as 'pending' | 'paid' | 'failed' | 'amount_mismatch' }
              : payment
          )
        );
        
        toast({
          title: "Status updated",
          description: `Payment #${selectedPayment.payment_id} status has been updated to ${newStatus}`,
        });
        
        // Clear form immediately
        setSelectedPayment(null);
        setNewStatus("");
        setReason("");
        
        // Refresh data in background (no setTimeout needed)
        fetchPayments(true);
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Failed to update payment status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !adminToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">You need to be logged in to access this page.</p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-[hsl(var(--navbar))] text-navbar-foreground px-4 sm:px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg ring-2 ring-primary/20 overflow-hidden">
              <img 
                src="/Skillyme LOGO.jpg" 
                alt="Skillyme Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-white dark:text-foreground truncate">Skillyme Admin</h1>
              <p className="text-xs sm:text-sm text-white/80 dark:text-muted-foreground hidden sm:block">Order Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/sessions">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sessions</span>
              </Button>
            </Link>
            <ThemeToggle />
            <Button 
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          {/* Header Section */}
          <div className="mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Recent Payments</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track all customer M-Pesa payments</p>
          </div>
          
          {/* Auto-refresh controls - Mobile Stacked Layout */}
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'} ${newPaymentsDetected ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm text-muted-foreground">
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                  {newPaymentsDetected && (
                    <span className="ml-2 text-green-600 font-medium animate-pulse">• New payments!</span>
                  )}
                </span>
              </div>
              
              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(false)}
                  disabled={isRefreshing}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Now
                    </>
                  )}
                </Button>
              </div>
              
              {/* Last Updated */}
              {lastRefresh && (
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments Table - Responsive */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Fullnames</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>M-pesa Code</TableHead>
                  <TableHead>Expected Amount</TableHead>
                  <TableHead>Actual Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.payment_id} className={payment.amount_mismatch ? "bg-orange-50 dark:bg-orange-900/20" : ""}>
                      <TableCell className="font-medium">{payment.payment_id}</TableCell>
                      <TableCell>{payment.user_name}</TableCell>
                      <TableCell>{payment.user_email}</TableCell>
                      <TableCell className="font-mono">{payment.mpesa_code}</TableCell>
                      <TableCell className="font-medium">KSh {parseFloat(String(payment.amount)).toFixed(2)}</TableCell>
                      <TableCell className={`font-medium ${payment.amount_mismatch ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        KSh {parseFloat(String(payment.actual_amount)).toFixed(2)}
                        {payment.amount_mismatch && (
                          <div className="text-xs text-orange-500 mt-1">⚠️ Mismatch</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            payment.status === "paid" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : payment.status === "amount_mismatch"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {payment.status === "amount_mismatch" ? "Amount Mismatch" : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(payment.submission_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => handleViewPayment(payment)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading payments...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                Error: {error}
              </div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No payments found.
              </div>
            ) : (
              <div className="divide-y">
                {payments.map((payment) => (
                  <div 
                    key={payment.payment_id}
                    className={`p-4 ${payment.amount_mismatch ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg">Payment #{payment.payment_id}</h3>
                        <p className="text-sm text-muted-foreground truncate">{payment.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{payment.user_email}</p>
                      </div>
                      <Badge 
                        className={`text-xs ml-2 flex-shrink-0 ${
                          payment.status === "paid" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : payment.status === "amount_mismatch"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {payment.status === "amount_mismatch" ? "Amount Mismatch" : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">M-Pesa Code:</span>
                        <p className="font-mono text-xs break-all">{payment.mpesa_code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Date:</span>
                        <p className="text-xs">{new Date(payment.submission_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Expected:</span>
                        <p className="font-medium">KSh {parseFloat(String(payment.amount)).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Actual:</span>
                        <p className={`font-medium ${payment.amount_mismatch ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          KSh {parseFloat(String(payment.actual_amount)).toFixed(2)}
                        </p>
                        {payment.amount_mismatch && (
                          <div className="text-xs text-orange-500">⚠️ Mismatch</div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleViewPayment(payment)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Payment #{selectedPayment?.payment_id}</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 sm:space-y-6">
              {/* Payment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">{selectedPayment.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">M-Pesa Code</p>
                  <p className="font-mono font-medium">{selectedPayment.mpesa_code}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Full M-Pesa Confirmation Message</p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border">
                    <p className="text-sm font-mono whitespace-pre-wrap break-words">
                      {selectedPayment.full_mpesa_message || 'No message available'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expected Amount</p>
                  <p className="font-medium">KSh {parseFloat(String(selectedPayment.amount)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Actual Amount Paid</p>
                  <p className={`font-medium ${selectedPayment.amount_mismatch ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    KSh {parseFloat(String(selectedPayment.actual_amount)).toFixed(2)}
                    {selectedPayment.amount_mismatch && (
                      <span className="text-xs text-orange-500 ml-2">⚠️ Mismatch</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Session</p>
                  <p className="font-medium">{selectedPayment.session_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Submission Date</p>
                  <p className="font-medium">{new Date(selectedPayment.submission_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Status</p>
                <Badge 
                  className={
                    selectedPayment.status === "paid" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                      : selectedPayment.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }
                >
                  {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                </Badge>
              </div>

              {/* Amount Mismatch Alert */}
              {selectedPayment.amount_mismatch && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                    <p className="font-semibold text-orange-800 dark:text-orange-200">Amount Mismatch Detected</p>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This user paid <strong>KSh {parseFloat(String(selectedPayment.actual_amount)).toFixed(2)}</strong> instead of the expected 
                    <strong> KSh {parseFloat(String(selectedPayment.amount)).toFixed(2)}</strong>. 
                    Please review this payment before confirming.
                  </p>
                </div>
              )}

              {/* Session Information */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Session Information</p>
                <p className="text-sm bg-muted p-4 rounded-md">
                  {selectedPayment.session_title}
                </p>
              </div>

              {/* Update Status Form */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (if failed)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for status change..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedPayment(null)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateStatus}
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
