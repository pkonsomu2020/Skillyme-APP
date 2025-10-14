import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data matching CSV structure exactly
  const [formData, setFormData] = useState({
    // Required fields
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    
    // Optional basic fields
    county: "",
    field_of_study: "",
    institution: "",
    level_of_study: "",
    
    // Enhanced fields (matching CSV columns exactly)
    preferred_name: "",
    date_of_birth: "",
    course_of_study: "",
    degree: "",
    year_of_study: "",
    primary_field_interest: "",
    signup_source: ""
  });

  const countries = [
    "Kenya", "Nigeria", "South Africa", "Ghana", "Uganda", "Tanzania", "Ethiopia",
    "Morocco", "Algeria", "Egypt", "Tunisia", "Libya", "Sudan", "Angola", "Mozambique",
    "Madagascar", "Cameroon", "Côte d'Ivoire", "Niger", "Burkina Faso", "Mali", "Malawi",
    "Zambia", "Somalia", "Senegal", "Chad", "Sierra Leone", "Liberia", "Central African Republic",
    "Mauritania", "Eritrea", "Gambia", "Botswana", "Gabon", "Lesotho", "Guinea-Bissau",
    "Equatorial Guinea", "Mauritius", "Eswatini", "Djibouti", "Fiji", "Comoros", "Cape Verde",
    "São Tomé and Príncipe", "Seychelles", "Other"
  ];

  const counties = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
    "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
    "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu",
    "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
    "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
    "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi",
    "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ];

  const levelsOfStudy = ["High School", "Undergraduate", "Graduate", "Postgraduate"];

  const degrees = [
    "Certificate", "Diploma", "Bachelor's Degree", "Master's Degree",
    "PhD/Doctorate", "Professional Qualification", "Other"
  ];

  const yearsOfStudy = [
    "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year",
    "6th Year", "Graduate", "Postgraduate", "Other"
  ];

  const primaryFieldInterests = [
    "Technology & Software Development",
    "Business & Entrepreneurship",
    "Healthcare & Medicine",
    "Education & Teaching",
    "Law & Legal Services",
    "Engineering",
    "Finance & Banking",
    "Marketing & Communications",
    "Arts & Design",
    "Science & Research",
    "Agriculture & Environment",
    "Government & Public Service",
    "Non-profit & Social Work",
    "Sports & Recreation",
    "Other"
  ];

  const signupSources = [
    "Social Media (Facebook, Instagram, Twitter)",
    "Google Search",
    "Friend/Family Recommendation",
    "University/College",
    "Career Fair",
    "Online Advertisement",
    "Email Newsletter",
    "Podcast",
    "YouTube",
    "LinkedIn",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Enhanced password validation
    const passwordErrors = [];

    if (formData.password.length < 8) {
      passwordErrors.push('Password must be at least 8 characters long');
    }

    if (formData.password.length > 128) {
      passwordErrors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(formData.password)) {
      passwordErrors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(formData.password)) {
      passwordErrors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(formData.password)) {
      passwordErrors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
      passwordErrors.push('Password must contain at least one special character');
    }

    if (passwordErrors.length > 0) {
      toast.error(passwordErrors[0]);
      return;
    }

    // Validate county field for Kenya
    if (formData.country === "Kenya" && !formData.county) {
      toast.error("Please select a county!");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("🚀 Starting registration process...");

      // Prepare data matching CSV structure exactly
      const userData = {
        // Required fields
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        country: formData.country,
        
        // Optional fields - send empty string as null for proper database handling
        county: formData.county || null,
        field_of_study: formData.field_of_study || null,
        institution: formData.institution || null,
        level_of_study: formData.level_of_study || null,
        
        // Enhanced fields - matching CSV columns exactly
        preferred_name: formData.preferred_name || null,
        date_of_birth: formData.date_of_birth || null,
        course_of_study: formData.course_of_study || null,
        degree: formData.degree || null,
        year_of_study: formData.year_of_study || null,
        primary_field_interest: formData.primary_field_interest || null,
        signup_source: formData.signup_source || null
      };

      console.log("📤 Sending registration data:", { 
        ...userData, 
        password: "***" 
      });

      const success = await register(userData);

      if (success) {
        console.log("✅ Registration successful!");
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        console.log("❌ Registration failed");
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary/30 via-background to-secondary/30">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg ring-2 ring-primary/20 overflow-hidden">
            <img
              src="/Skillyme LOGO.jpg"
              alt="Skillyme Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-3xl">Create Your Account</CardTitle>
          <CardDescription className="text-base">
            Join Skillyme and start your journey to success
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Required Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+254 700 000 000"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select value={formData.country} onValueChange={(value) => handleChange("country", value)} required>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* County field - only show if country is Kenya */}
            {formData.country === "Kenya" && (
              <div className="space-y-2">
                <Label htmlFor="county">County *</Label>
                <Select value={formData.county} onValueChange={(value) => handleChange("county", value)} required>
                  <SelectTrigger id="county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                    {counties.map((county) => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Basic Optional Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input
                  id="field_of_study"
                  placeholder="Computer Science"
                  value={formData.field_of_study}
                  onChange={(e) => handleChange("field_of_study", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level_of_study">Level of Study</Label>
                <Select value={formData.level_of_study} onValueChange={(value) => handleChange("level_of_study", value)}>
                  <SelectTrigger id="level_of_study">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                    {levelsOfStudy.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution/University</Label>
              <Input
                id="institution"
                placeholder="University of Nairobi"
                value={formData.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
              />
            </div>

            {/* Enhanced Fields Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-primary">Additional Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    placeholder="Johnny"
                    value={formData.preferred_name}
                    onChange={(e) => handleChange("preferred_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_of_study">Course of Study</Label>
                  <Input
                    id="course_of_study"
                    placeholder="Bachelor of Science in Computer Science"
                    value={formData.course_of_study}
                    onChange={(e) => handleChange("course_of_study", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degree">Degree Type</Label>
                  <Select value={formData.degree} onValueChange={(value) => handleChange("degree", value)}>
                    <SelectTrigger id="degree">
                      <SelectValue placeholder="Select degree type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                      {degrees.map((degree) => (
                        <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year_of_study">Year of Study</Label>
                  <Select value={formData.year_of_study} onValueChange={(value) => handleChange("year_of_study", value)}>
                    <SelectTrigger id="year_of_study">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                      {yearsOfStudy.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_field_interest">Primary Field of Interest</Label>
                  <Select value={formData.primary_field_interest} onValueChange={(value) => handleChange("primary_field_interest", value)}>
                    <SelectTrigger id="primary_field_interest">
                      <SelectValue placeholder="Select your interest" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                      {primaryFieldInterests.map((interest) => (
                        <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_source">How did you hear about Skillyme?</Label>
                <Select value={formData.signup_source} onValueChange={(value) => handleChange("signup_source", value)}>
                  <SelectTrigger id="signup_source">
                    <SelectValue placeholder="Select how you heard about us" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" position="popper">
                    {signupSources.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-sm text-green-600">✓ Passwords match</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;