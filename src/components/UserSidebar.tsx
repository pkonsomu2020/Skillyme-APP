import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, Video, MessageSquare, Phone, FileText, Trophy, User, LogOut, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Sessions", url: "/dashboard/sessions", icon: Video },
  { title: "Assignments", url: "/dashboard/assignments", icon: FileText },
  { title: "Leaderboard", url: "/dashboard/leaderboard", icon: Trophy },
  // { title: "Find Recruiters", url: "/dashboard/find-recruiters", icon: Search }, // Hidden for now - will be used later
  // { title: "Community", url: "/dashboard/community", icon: MessageSquare }, // Hidden for now - will be used later
  { title: "Contact", url: "/dashboard/contact", icon: Phone },
];

export function UserSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    // Handle exact matches
    if (location.pathname === path) return true;
    
    // Handle dashboard root - show as active when on /dashboard or /dashboard/
    if (path === "/dashboard" && (location.pathname === "/dashboard" || location.pathname === "/dashboard/")) {
      return true;
    }
    
    return false;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar className="border-r border-border/40 flex flex-col h-full">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/40 px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg ring-2 ring-primary/20 overflow-hidden">
            <img 
              src="/Skillyme LOGO.jpg" 
              alt="Skillyme Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="font-bold text-base md:text-lg bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Skillyme
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4 flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="h-12 md:h-10">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-4 py-3 md:py-2 rounded-lg transition-all duration-200 text-sm md:text-base ${
                        isActive(item.url)
                          ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-sm dark:bg-primary/20 dark:text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 md:w-4 md:h-4 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Mobile Profile Section */}
      <SidebarFooter className="p-3 border-t border-border/40 md:hidden bg-background flex-shrink-0">
        {user && (
          <div className="space-y-3">
            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 gap-2 text-xs bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">Full Name:</span>
                <span className="text-muted-foreground truncate ml-auto">{user.name || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">Email:</span>
                <span className="text-muted-foreground truncate ml-auto">{user.email || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">Phone:</span>
                <span className="text-muted-foreground truncate ml-auto">{user.phone || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">Location:</span>
                <span className="text-muted-foreground truncate ml-auto">{user.country || 'Not provided'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="w-full justify-center h-10 text-sm font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
