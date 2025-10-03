import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  county?: string;
}

interface ProfileDropdownProps {
  user: UserProfile;
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // PERFORMANCE: Removed excessive debug logging

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // PERFORMANCE: Removed excessive debug logging
      
      // Use AuthContext logout function to properly clear state
      logout();
      
      // PERFORMANCE: Removed excessive debug logging
      
      // Show success message
      toast.success("Logged out successfully");
      
      // Navigate to home page
      navigate("/");
      
      // PERFORMANCE: Removed excessive debug logging
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      toast.error("Logout failed");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="hidden md:block text-sm font-medium">{user.name}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="space-y-1">
              {/* User Info */}
              <div className="px-3 py-2 text-sm">
                <p className="font-medium">Full Name</p>
                <p className="text-muted-foreground">{user.name}</p>
              </div>
              
              <div className="px-3 py-2 text-sm">
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="px-3 py-2 text-sm">
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">{user.phone || 'Not provided'}</p>
              </div>

              {user.country && (
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">
                    {user.country}
                    {user.county && `, ${user.county}`}
                  </p>
                </div>
              )}

              {/* Logout Button */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
