import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, Users, Calendar, GraduationCap, TrendingUp, 
  Target, Award, Globe, Shield, Sparkles, ArrowRight, 
  BarChart3, UserCheck, Briefcase, Star, Zap, Heart
} from "lucide-react";
import heroImage from "@/assets/Hero-BG.jpg";
import { useEffect, useState } from "react";

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate stats when they come into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  // Animated counter component
  const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!statsAnimated) return;
      
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [statsAnimated, end, duration]);

    return <span>{count}{suffix}</span>;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4 animate-pulse">
                🎯 Talent Deserves Direction, Not Doubt
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Mentorship that{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  proves your skills
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Connecting students with vetted professionals for real-world guidance. 
                From secondary school to postgraduate level, we bridge the gap between education and employment.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button variant="hero" size="xl" className="shadow-glow group">
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Free registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Vetted mentors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Verified badges</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full animate-pulse"></div>
              <img 
                src={heroImage} 
                alt="Students connecting with mentors" 
                className="relative rounded-2xl shadow-2xl w-full hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Reality We're Solving - Statistics Section */}
      <section id="stats-section" className="py-20 px-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Reality We're Solving</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Direction shouldn't be a privilege — it should be accessible
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Skills Gap */}
            <Card className="border-2 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={statsAnimated ? `${2 * Math.PI * 56 * (1 - 0.65)}` : `${2 * Math.PI * 56}`}
                      className="text-red-500 transition-all duration-2000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-red-500">
                      <AnimatedCounter end={65} suffix="%" />
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-red-600">Skills Gap</h3>
                <p className="text-muted-foreground">
                  Employers report graduates lack job-ready skills for today's market
                </p>
              </CardContent>
            </Card>

            {/* Confidence Gap */}
            <Card className="border-2 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={statsAnimated ? `${2 * Math.PI * 56 * (1 - 0.70)}` : `${2 * Math.PI * 56}`}
                      className="text-orange-500 transition-all duration-2000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-orange-500">
                      <AnimatedCounter end={70} suffix="%" />
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-orange-600">Confidence Gap</h3>
                <p className="text-muted-foreground">
                  Students hesitate to approach industry professionals for guidance
                </p>
              </CardContent>
            </Card>

            {/* Access Gap */}
            <Card className="border-2 hover:border-yellow-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={statsAnimated ? `${2 * Math.PI * 56 * (1 - 0.80)}` : `${2 * Math.PI * 56}`}
                      className="text-yellow-500 transition-all duration-2000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-yellow-500">
                      <AnimatedCounter end={80} suffix="%" />
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-yellow-600">Access Gap</h3>
                <p className="text-muted-foreground">
                  Traditional mentorship programmes remain expensive and inconsistent
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SkillyMe Exists */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why SkillyMe Exists</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We've seen talented students lose direction — and we believe that should never happen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Lost Direction</h3>
                <p className="text-muted-foreground">
                  Thousands of students graduate yearly, uncertain about their next steps and career paths
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Degree Disillusionment</h3>
                <p className="text-muted-foreground">
                  Many realise too late that qualifications alone don't guarantee employment success
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary p-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Confidence Crisis</h3>
                <p className="text-muted-foreground">
                  Poor guidance leads to wrong choices, fear of reaching professionals, and diminished self-belief
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Mentorship Flow */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Mentorship Flow</h2>
            <p className="text-xl text-muted-foreground">Your journey from learning to landing your dream career</p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Card className="relative border-2 hover:border-primary transition-all duration-300">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                      1
                    </div>
                    <Users className="w-10 h-10 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2 text-lg">Student</h3>
                    <p className="text-sm text-muted-foreground">Starts learning and seeking guidance</p>
                  </CardContent>
                </Card>
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Card className="relative border-2 hover:border-primary transition-all duration-300">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                      2
                    </div>
                    <UserCheck className="w-10 h-10 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2 text-lg">Mentor</h3>
                    <p className="text-sm text-muted-foreground">Provides coaching and skills feedback</p>
                  </CardContent>
                </Card>
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Card className="relative border-2 hover:border-primary transition-all duration-300">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                      3
                    </div>
                    <Briefcase className="w-10 h-10 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2 text-lg">Recruiter</h3>
                    <p className="text-sm text-muted-foreground">Evaluates fit and shares opportunities</p>
                  </CardContent>
                </Card>
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Card className="relative border-2 hover:border-primary transition-all duration-300">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                      4
                    </div>
                    <Star className="w-10 h-10 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2 text-lg">Career</h3>
                    <p className="text-sm text-muted-foreground">Secures a relevant job or role</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 6 Steps */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple steps to transform your career journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Join SkillyMe</h3>
                    <p className="text-sm text-muted-foreground">Free registration opens doors to our mentorship community</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Skills Assessment</h3>
                    <p className="text-sm text-muted-foreground">AI-driven evaluation creates your personalised career roadmap</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Mentorship Sessions</h3>
                    <p className="text-sm text-muted-foreground">Affordable group clinics and one-to-one guidance from industry experts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Earn Verified Badges</h3>
                    <p className="text-sm text-muted-foreground">Build credibility with mentor-endorsed skill certifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Access Opportunities</h3>
                    <p className="text-sm text-muted-foreground">Connect directly with recruiters and CEOs seeking talent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform">
                    6
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Global Expansion</h3>
                    <p className="text-sm text-muted-foreground">International mentorship for worldwide career perspectives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Core Offerings */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-primary-glow/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Your Future, Guided</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to transform your career journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Build Clarity & Confidence</h3>
                <p className="text-muted-foreground">
                  Discover your true career path with expert guidance and support
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Learn Real-World Skills</h3>
                <p className="text-muted-foreground">
                  Acquire practical expertise directly from industry professionals
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Access Recruiters & CEOs</h3>
                <p className="text-muted-foreground">
                  Gain direct exposure to decision-makers and hiring opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Earn Verified Credentials</h3>
                <p className="text-muted-foreground">
                  Build credibility with mentor-endorsed skill certifications
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Global Mentorship Access</h3>
                <p className="text-muted-foreground">
                  Connect with international professionals for worldwide perspectives
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Career Growth</h3>
                <p className="text-muted-foreground">
                  Continuous support and guidance throughout your professional journey
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Difference - Outcome-First Mentorship */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Difference: Outcome-First Mentorship</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We don't sell hope — we deliver measurable results
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-elegant">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Carefully Vetted Mentors</h3>
                    <p className="text-muted-foreground">
                      Every mentor is verified for expertise and empathy, ensuring you get guidance from professionals who truly care
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-elegant">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Clear Action Plans</h3>
                    <p className="text-muted-foreground">
                      Every session comes with concrete next steps and measurable goals to track your progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-elegant">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Safe, Supportive Spaces</h3>
                    <p className="text-muted-foreground">
                      Judgment-free environment where you can ask questions, share concerns, and grow with confidence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-elegant">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Affordable Accessibility</h3>
                    <p className="text-muted-foreground">
                      Quality mentorship shouldn't break the bank. We make expert guidance accessible to all students
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center max-w-3xl mx-auto">
            <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary-glow/5">
              <CardContent className="py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-4">We Care, Deeply</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  "We exist because we've seen talented students lose direction — and we believe that should never happen."
                </p>
                <p className="text-lg text-muted-foreground">
                  "Every student deserves guidance from someone who's walked their path before."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stats Section */}
      <section className="py-20 px-4 gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-primary-foreground">Join the Movement</h2>
            <p className="text-xl text-primary-foreground/90">
              Where talent meets direction, and dreams become reality
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center text-primary-foreground">
            <div className="group hover:scale-110 transition-transform duration-300">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-bold mb-2">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-lg opacity-90">Students Connected</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-bold mb-2">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-lg opacity-90">Sessions Conducted</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-bold mb-2">
                <AnimatedCounter end={30} suffix="+" />
              </div>
              <div className="text-lg opacity-90">Partner Mentors & Recruiters</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="border-2 border-primary shadow-elegant relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary-glow/10"></div>
            <CardContent className="py-16 text-center relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of students who are already connecting with top mentors and recruiters, 
                building real skills, and exploring exciting career opportunities.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/signup">
                  <Button variant="hero" size="xl" className="shadow-glow group">
                    For Students - Take the First Step
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="xl" className="group">
                    For Professionals - Become a Mentor
                    <Heart className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-muted-foreground italic">
                "Become the reason someone doesn't give up"
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-secondary/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
                  SkillyMe
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Talent Deserves Direction, Not Doubt
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Connecting students with vetted professionals for real-world guidance.
              </p>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>📧 skillyme25@gmail.com</p>
                <p>📞 +254 745 266 526</p>
                <p>📍 Nairobi, Kenya</p>
                <p>🕒 Mon-Fri: 8AM-6PM EAT</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
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

            {/* For Students & Professionals */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Get Started</h3>
              <div className="space-y-3">
                <Link to="/signup">
                  <Button variant="outline" size="sm" className="w-full">
                    For Students
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="sm" className="w-full">
                    For Professionals
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              &copy; 2025 SkillyMe. All rights reserved.
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Where talent meets direction, and dreams become reality
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
