import { Button } from "@/components/ui/button";
import { Video, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import DashboardOverview from "./DashboardOverview";
import Sessions from "./Sessions";
import FindRecruiters from "./FindRecruiters";
import Community from "./Community";
import Contact from "./Contact";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-secondary/30">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <UserSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="font-bold text-lg">Skillyme</h1>
                      <p className="text-xs text-muted-foreground">Student Dashboard</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route index element={<DashboardOverview />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="find-recruiters" element={<FindRecruiters />} />
                <Route path="community" element={<Community />} />
                <Route path="contact" element={<Contact />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Dashboard;
