import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Users, Calendar, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/Hero-BG.jpg";

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Connect Your Future with{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Top Recruiters
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Join interactive online career sessions and connect directly with recruiters. 
                Explore opportunities, gain insights, and prepare for your dream job.
              </p>
              <div className="flex flex-wrap gap-4">
                {!isLoading && (
                  <>
                    {!isAuthenticated ? (
                      <>
                        <Link to="/signup">
                          <Button variant="hero" size="xl" className="shadow-glow">
                            Get Started Now
                          </Button>
                        </Link>
                        <Link to="/login">
                          <Button variant="outline" size="xl">
                            Sign In
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link to="/dashboard">
                        <Button variant="hero" size="xl" className="shadow-glow">
                          Back to Dashboard
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Only 200 KES per session</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Direct recruiter access</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <img 
                src={heroImage} 
                alt="Students connecting with recruiters" 
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Skillyme?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We bridge the gap between ambitious students and forward-thinking recruiters
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-smooth hover:shadow-elegant">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <circle cx="8" cy="8" r="1"/>
                    <circle cx="12" cy="8" r="1"/>
                    <circle cx="16" cy="8" r="1"/>
                    <circle cx="8" cy="12" r="1"/>
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="16" cy="12" r="1"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Interactive Sessions</h3>
                <p className="text-muted-foreground">
                  Join live online sessions with recruiters from leading companies. 
                  Ask questions, get insights, and make lasting connections.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-smooth hover:shadow-elegant">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    <path d="M12 11l2 2 4-4"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M8 16h8"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Direct Access</h3>
                <p className="text-muted-foreground">
                  No middlemen, no barriers. Connect directly with recruiters and 
                  showcase your potential in real-time conversations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-smooth hover:shadow-elegant">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M3 3v18h18"/>
                    <path d="M7 12l3-3 3 3 5-5"/>
                    <path d="M18 8l-5 5-3-3-3 3"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Career Growth</h3>
                <p className="text-muted-foreground">
                  Gain valuable insights, learn about opportunities, and prepare 
                  yourself for the job market with expert guidance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple steps to connect with your future</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-sm text-muted-foreground">Create your account in minutes</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="font-semibold mb-2">Browse Sessions</h3>
              <p className="text-sm text-muted-foreground">Explore upcoming career sessions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="font-semibold mb-2">Pay & Join</h3>
              <p className="text-sm text-muted-foreground">Secure payment via M-Pesa</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                4
              </div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-sm text-muted-foreground">Meet recruiters via Google Meet</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 gradient-hero">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center text-primary-foreground">
            <div>
              <Users className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Students Connected</div>
            </div>
            <div>
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Sessions Conducted</div>
            </div>
            <div>
              <GraduationCap className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">30+</div>
              <div className="text-lg opacity-90">Partner Recruiters</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="border-2 border-primary shadow-elegant">
            <CardContent className="py-16 text-center">
              {!isAuthenticated ? (
                <>
                  <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join hundreds of students who are already connecting with top recruiters 
                    and exploring exciting career opportunities.
                  </p>
                  <Link to="/signup">
                    <Button variant="hero" size="xl" className="shadow-glow">
                      Create Your Account
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Continue your journey by exploring upcoming sessions and connecting 
                    with recruiters in your field of interest.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link to="/dashboard">
                      <Button variant="hero" size="xl" className="shadow-glow">
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link to="/dashboard/sessions">
                      <Button variant="outline" size="xl">
                        Browse Sessions
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-secondary/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg ring-2 ring-primary/20 overflow-hidden">
                  <img 
                    src="/Skillyme LOGO.jpg" 
                    alt="Skillyme Logo" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Skillyme
                </span>
              </div>
              <p className="text-muted-foreground">
                Connecting students with recruiters through interactive career sessions.
              </p>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>📧 skillyme25@gmail.com</p>
                <p>📞 +254 745 266526</p>
                <p>📍 Nairobi, Kenya</p>
                <p>🕒 Mon-Fri: 8AM-6PM</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/dashboard" className="block text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/dashboard/sessions" className="block text-muted-foreground hover:text-primary transition-colors">
                  Sessions
                </Link>
                <Link to="/dashboard/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
                <Link to="/login" className="block text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Skillyme. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
