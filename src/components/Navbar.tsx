import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Menu, X, LayoutDashboard, FileText, Trophy, Search, MessageSquare, Phone, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Safely get auth context
  let isAuthenticated = false;
  let user = null;
  let isLoading = false;
  let logout = null;
  
  try {
    const authContext = useAuth();
    isAuthenticated = authContext?.isAuthenticated || false;
    user = authContext?.user || null;
    isLoading = authContext?.isLoading || false;
    logout = authContext?.logout || null;
    
    // PERFORMANCE: Removed excessive debug logging
  } catch (error) {
    // PERFORMANCE: Removed excessive warning logging
  }

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg ring-2 ring-primary/20 overflow-hidden">
            <img 
              src="/Skillyme LOGO.jpg" 
              alt="Skillyme Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Skillyme
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : isAuthenticated && user ? (
            <ProfileDropdown user={user} />
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="default">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 h-10 w-10"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-sm border-b border-border shadow-lg">
          <div className="px-4 py-6 space-y-6">
            {/* Mobile Menu Items - Complete Navigation */}
            <div className="space-y-3">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/dashboard/sessions" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <Video className="w-5 h-5 mr-3" />
                  Sessions
                </Button>
              </Link>
              <Link to="/dashboard/assignments" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <FileText className="w-5 h-5 mr-3" />
                  Assignments
                </Button>
              </Link>
              <Link to="/dashboard/leaderboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <Trophy className="w-5 h-5 mr-3" />
                  Leaderboard
                </Button>
              </Link>
              <Link to="/dashboard/find-recruiters" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <Search className="w-5 h-5 mr-3" />
                  Find Recruiters
                </Button>
              </Link>
              <Link to="/dashboard/community" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Community
                </Button>
              </Link>
              <Link to="/dashboard/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                  <Phone className="w-5 h-5 mr-3" />
                  Contact
                </Button>
              </Link>
              
              {isLoading ? (
                <div className="pt-4 border-t border-border">
                  <div className="px-3 py-3 text-base text-muted-foreground">
                    Loading...
                  </div>
                </div>
              ) : isAuthenticated && user ? (
                <div className="pt-4 border-t border-border space-y-4">
                  {/* Mobile Profile Section */}
                  <div className="px-3 py-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-foreground truncate">{user.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Full Name</span>
                        <span className="text-muted-foreground truncate ml-2">{user.name || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Email</span>
                        <span className="text-muted-foreground truncate ml-2">{user.email || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Phone</span>
                        <span className="text-muted-foreground truncate ml-2">{user.phone || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Location</span>
                        <span className="text-muted-foreground truncate ml-2">
                          {user.country ? `${user.country}${user.county ? `, ${user.county}` : ''}` : 'Not provided'}
                        </span>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            setIsMobileMenuOpen(false);
                            // Use the logout function from the auth context
                            if (logout) {
                              await logout();
                              // Force page reload to ensure clean state
                              window.location.href = '/';
                            }
                          } catch (error) {
                            console.error('Logout error:', error);
                            // Force logout even if there's an error
                            localStorage.clear();
                            window.location.href = '/';
                          }
                        }}
                        className="w-full justify-center h-10 text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-border space-y-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full h-12 text-base font-medium">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
