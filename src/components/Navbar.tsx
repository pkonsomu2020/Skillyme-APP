import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Menu, X } from "lucide-react";
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
  
  try {
    const authContext = useAuth();
    isAuthenticated = authContext?.isAuthenticated || false;
    user = authContext?.user || null;
    isLoading = authContext?.isLoading || false;
    
    // Debug authentication state
    console.log('Navbar: isAuthenticated:', isAuthenticated, 'user:', user ? 'Present' : 'Null', 'isLoading:', isLoading);
  } catch (error) {
    console.warn('Auth context not available:', error);
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
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border shadow-lg">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Menu Items */}
            <div className="space-y-2">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Dashboard
                </Button>
              </Link>
              <Link to="/dashboard/find-recruiters" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Find Recruiters
                </Button>
              </Link>
              <Link to="/dashboard/sessions" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Sessions
                </Button>
              </Link>
              <Link to="/dashboard/community" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Community
                </Button>
              </Link>
              <Link to="/dashboard/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Contact
                </Button>
              </Link>
              
              {isLoading ? (
                <div className="pt-2 border-t border-border">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading...
                  </div>
                </div>
              ) : isAuthenticated && user ? (
                <div className="pt-2 border-t border-border">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-border">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full mt-2">
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
