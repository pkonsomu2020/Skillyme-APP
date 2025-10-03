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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    county: "",
    fieldOfStudy: "",
    institution: "",
    levelOfStudy: "",
    password: "",
    confirmPassword: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Enhanced password validation to match backend requirements
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
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      passwordErrors.push('Password must contain at least one special character');
    }
    
    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', 'admin', 'test', 'user',
      'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon',
      'master', 'hello', 'login', 'pass', '123456789', 'password1'
    ];
    
    if (commonPasswords.includes(formData.password.toLowerCase())) {
      passwordErrors.push('Password is too common. Please choose a more secure password');
    }
    
    // Check for sequential characters
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
                      'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs',
                      'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
    
    const lowerPassword = formData.password.toLowerCase();
    if (sequences.some(seq => lowerPassword.includes(seq))) {
      passwordErrors.push('Password contains sequential characters (e.g., 123, abc)');
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(formData.password)) {
      passwordErrors.push('Password contains too many repeated characters');
    }
    
    if (passwordErrors.length > 0) {
      toast.error(passwordErrors[0]); // Show first error
      return;
    }

    // Validate county field for Kenya
    if (formData.country === "Kenya" && !formData.county) {
      toast.error("Please select a county!");
      return;
    }

    try {
      // Prepare data for API
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        county: formData.country === "Kenya" ? formData.county : null,
        fieldOfStudy: formData.fieldOfStudy,
        institution: formData.institution || null,
        levelOfStudy: formData.levelOfStudy,
        password: formData.password
      };

      const success = await register(userData);
      
      if (success) {
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      toast.error(error.message || "Registration failed. Please try again.");
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
                  <SelectContent>
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
                  <SelectContent>
                    {counties.map((county) => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                <Input
                  id="fieldOfStudy"
                  placeholder="Computer Science"
                  value={formData.fieldOfStudy}
                  onChange={(e) => handleChange("fieldOfStudy", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="levelOfStudy">Level of Study *</Label>
                <Select value={formData.levelOfStudy} onValueChange={(value) => handleChange("levelOfStudy", value)} required>
                  <SelectTrigger id="levelOfStudy">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
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
                {/* Password Requirements */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Password Requirements:</p>
                    {formData.password && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Strength:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => {
                            const strength = Math.min(4, Math.floor(
                              (formData.password.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(formData.password) ? 1 : 0) +
                              (/[a-z]/.test(formData.password) ? 1 : 0) +
                              (/\d/.test(formData.password) ? 1 : 0) +
                              (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 1 : 0) +
                              (!/(.)\1{2,}/.test(formData.password) ? 1 : 0) +
                              (!/123|abc|qwe|asd|zxc/i.test(formData.password) ? 1 : 0)
                            ));
                            return (
                              <div
                                key={level}
                                className={`w-2 h-2 rounded-full ${
                                  level <= strength 
                                    ? strength <= 2 
                                      ? 'bg-red-500' 
                                      : strength <= 3 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{/\d/.test(formData.password) ? '✓' : '○'}</span>
                      One number
                    </li>
                    <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span>
                      One special character
                    </li>
                    <li className={`flex items-center gap-2 ${!/(.)\1{2,}/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{!/(.)\1{2,}/.test(formData.password) ? '✓' : '○'}</span>
                      No repeated characters (e.g., 111, aaa)
                    </li>
                    <li className={`flex items-center gap-2 ${!/123|abc|qwe|asd|zxc/i.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>{!/123|abc|qwe|asd|zxc/i.test(formData.password) ? '✓' : '○'}</span>
                      No sequential characters (e.g., 123, abc)
                    </li>
                  </ul>
                </div>
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

            <Button type="submit" variant="hero" className="w-full" size="lg">
              Create Account
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
