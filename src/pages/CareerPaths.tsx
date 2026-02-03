import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  Stethoscope, 
  Scale, 
  Code, 
  Clock, 
  BookOpen, 
  Award, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Users,
  DollarSign,
  Target,
  Search,
  Building,
  Briefcase,
  Cpu,
  Leaf,
  Palette,
  Calculator,
  Globe,
  Heart,
  Wrench,
  ChevronRight,
  Star,
  MapPin,
  Calendar
} from "lucide-react";

interface CareerStep {
  title: string;
  duration: string;
  description: string;
  requirements: string[];
  keySkills: string[];
  kcseGrade: string;
  clusterPoints?: string;
}

interface CareerField {
  id: string;
  title: string;
  icon: any;
  description: string;
  color: string;
  courses: Course[];
  marketDemand: 'High' | 'Medium' | 'Low';
  averageSalary: string;
}

interface Course {
  id: string;
  title: string;
  duration: string;
  kcseRequirement: string;
  clusterPoints: string;
  description: string;
  careerOpportunities: string[];
  salaryRange: string;
  topUniversities: string[];
  steps: CareerStep[];
}

const careerFields: CareerField[] = [
  {
    id: "health-medical",
    title: "Health & Medical Sciences",
    icon: Stethoscope,
    description: "Healthcare careers serving Kenya's growing medical needs",
    color: "bg-red-50 border-red-200 text-red-800",
    marketDemand: "High",
    averageSalary: "KSh 80,000 - 500,000",
    courses: [
      {
        id: "medicine-surgery",
        title: "Bachelor of Medicine & Surgery (MBChB)",
        duration: "6 years",
        kcseRequirement: "A- (84+ points)",
        clusterPoints: "Cluster 2A: 84+ points",
        description: "Comprehensive medical training to become a licensed doctor in Kenya",
        careerOpportunities: [
          "Medical Doctor (KSh 200,000 - 500,000)",
          "Specialist Consultant (KSh 300,000 - 800,000)",
          "Medical Researcher (KSh 150,000 - 400,000)",
          "Public Health Officer (KSh 120,000 - 300,000)"
        ],
        salaryRange: "KSh 200,000 - 500,000+",
        topUniversities: ["University of Nairobi", "Moi University", "Kenyatta University", "Egerton University"],
        steps: [
          {
            title: "KCSE Excellence",
            duration: "Form 4",
            description: "Achieve exceptional grades in science subjects for medical school entry",
            requirements: [
              "KCSE Mean Grade A- (84+ points)",
              "Biology A (12 points)",
              "Chemistry A (12 points)", 
              "Physics/Mathematics A- (11+ points)",
              "English/Kiswahili B+ (10+ points)"
            ],
            keySkills: ["Scientific reasoning", "Critical thinking", "Academic excellence"],
            kcseGrade: "A- (84+ points)",
            clusterPoints: "Cluster 2A: 84+"
          },
          {
            title: "Medical School",
            duration: "6 years",
            description: "Intensive medical education combining theory and clinical practice",
            requirements: [
              "Complete pre-clinical studies (3 years)",
              "Clinical rotations (3 years)",
              "Pass all medical examinations",
              "Complete internship requirements"
            ],
            keySkills: ["Medical knowledge", "Patient care", "Clinical skills", "Communication"],
            kcseGrade: "Maintained throughout",
            clusterPoints: "University performance"
          },
          {
            title: "Medical Internship",
            duration: "1 year",
            description: "Supervised clinical practice in Kenyan hospitals",
            requirements: [
              "Register with Medical Practitioners Board",
              "Complete rotations in major departments",
              "Pass internship assessments",
              "Maintain professional standards"
            ],
            keySkills: ["Practical medicine", "Patient management", "Professional ethics"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          },
          {
            title: "Medical Practice/Specialization",
            duration: "3-5 years (specialization)",
            description: "Begin practice or pursue specialization in chosen field",
            requirements: [
              "Obtain medical license",
              "Choose specialization (optional)",
              "Complete residency training",
              "Continuous professional development"
            ],
            keySkills: ["Specialized expertise", "Leadership", "Research", "Teaching"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          }
        ]
      },
      {
        id: "nursing",
        title: "Bachelor of Science in Nursing",
        duration: "4 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 2B: 70+ points",
        description: "Professional nursing education for healthcare delivery in Kenya",
        careerOpportunities: [
          "Registered Nurse (KSh 60,000 - 150,000)",
          "Nurse Manager (KSh 100,000 - 200,000)",
          "Clinical Specialist (KSh 80,000 - 180,000)",
          "Public Health Nurse (KSh 70,000 - 160,000)"
        ],
        salaryRange: "KSh 60,000 - 200,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University", "KMTC"],
        steps: [
          {
            title: "KCSE Preparation",
            duration: "Form 4",
            description: "Strong performance in science subjects for nursing admission",
            requirements: [
              "KCSE Mean Grade B+ (70+ points)",
              "Biology B+ (10+ points)",
              "Chemistry B+ (10+ points)",
              "Mathematics/Physics B (9+ points)",
              "English B+ (10+ points)"
            ],
            keySkills: ["Science foundation", "Communication", "Empathy"],
            kcseGrade: "B+ (70+ points)",
            clusterPoints: "Cluster 2B: 70+"
          }
        ]
      }
    ]
  },
  {
    id: "law-legal",
    title: "Law & Legal Studies",
    icon: Scale,
    description: "Legal careers in Kenya's justice system and corporate sector",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    marketDemand: "High",
    averageSalary: "KSh 60,000 - 300,000",
    courses: [
      {
        id: "law",
        title: "Bachelor of Laws (LL.B)",
        duration: "4 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 1: 70+ points",
        description: "Comprehensive legal education for practice in Kenyan courts",
        careerOpportunities: [
          "Advocate/Lawyer (KSh 80,000 - 300,000)",
          "Corporate Counsel (KSh 120,000 - 400,000)",
          "Magistrate/Judge (KSh 200,000 - 600,000)",
          "Legal Advisor (KSh 100,000 - 250,000)"
        ],
        salaryRange: "KSh 80,000 - 300,000+",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University", "Strathmore University"],
        steps: [
          {
            title: "KCSE Achievement",
            duration: "Form 4",
            description: "Strong academic performance across subjects for law school",
            requirements: [
              "KCSE Mean Grade B+ (70+ points)",
              "English A- (11+ points)",
              "Kiswahili B+ (10+ points)",
              "Mathematics B (9+ points)",
              "Any other subject B+ (10+ points)"
            ],
            keySkills: ["Critical thinking", "Communication", "Analysis", "Writing"],
            kcseGrade: "B+ (70+ points)",
            clusterPoints: "Cluster 1: 70+"
          }
        ]
      }
    ]
  },
  {
    id: "engineering-technology",
    title: "Engineering & Technology",
    icon: Wrench,
    description: "Technical careers driving Kenya's infrastructure development",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    marketDemand: "High",
    averageSalary: "KSh 70,000 - 400,000",
    courses: [
      {
        id: "civil-engineering",
        title: "Bachelor of Civil Engineering",
        duration: "5 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 3: 70+ points",
        description: "Infrastructure development and construction engineering",
        careerOpportunities: [
          "Civil Engineer (KSh 80,000 - 250,000)",
          "Project Manager (KSh 150,000 - 400,000)",
          "Structural Engineer (KSh 120,000 - 350,000)",
          "Construction Manager (KSh 100,000 - 300,000)"
        ],
        salaryRange: "KSh 80,000 - 400,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Moi University", "Technical University of Kenya"],
        steps: []
      }
    ]
  },
  {
    id: "business-economics",
    title: "Business & Economics",
    icon: Briefcase,
    description: "Commercial and financial careers in Kenya's growing economy",
    color: "bg-green-50 border-green-200 text-green-800",
    marketDemand: "High",
    averageSalary: "KSh 50,000 - 350,000",
    courses: [
      {
        id: "business-administration",
        title: "Bachelor of Business Administration",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 4: 48+ points",
        description: "Comprehensive business management and administration",
        careerOpportunities: [
          "Business Manager (KSh 80,000 - 200,000)",
          "Marketing Manager (KSh 100,000 - 250,000)",
          "Human Resources Manager (KSh 90,000 - 220,000)",
          "Operations Manager (KSh 120,000 - 300,000)"
        ],
        salaryRange: "KSh 80,000 - 300,000",
        topUniversities: ["University of Nairobi", "Strathmore University", "USIU", "KCA University"],
        steps: []
      }
    ]
  },
  {
    id: "computer-science",
    title: "Computer Science & IT",
    icon: Code,
    description: "Technology careers in Kenya's digital transformation",
    color: "bg-purple-50 border-purple-200 text-purple-800",
    marketDemand: "High",
    averageSalary: "KSh 60,000 - 300,000",
    courses: [
      {
        id: "computer-science",
        title: "Bachelor of Computer Science",
        duration: "4 years",
        kcseRequirement: "B- (60+ points)",
        clusterPoints: "Cluster 5: 60+ points",
        description: "Software development and computer systems",
        careerOpportunities: [
          "Software Developer (KSh 70,000 - 200,000)",
          "Systems Analyst (KSh 80,000 - 180,000)",
          "IT Manager (KSh 120,000 - 300,000)",
          "Data Scientist (KSh 100,000 - 250,000)"
        ],
        salaryRange: "KSh 70,000 - 300,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Strathmore University", "KCA University"],
        steps: []
      }
    ]
  },
  {
    id: "agriculture",
    title: "Agriculture & Food Security",
    icon: Leaf,
    description: "Agricultural careers supporting Kenya's food security",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    marketDemand: "Medium",
    averageSalary: "KSh 45,000 - 200,000",
    courses: [
      {
        id: "agriculture",
        title: "Bachelor of Agriculture",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 6: 48+ points",
        description: "Modern farming and agricultural technology",
        careerOpportunities: [
          "Agricultural Officer (KSh 50,000 - 120,000)",
          "Farm Manager (KSh 60,000 - 150,000)",
          "Agricultural Consultant (KSh 80,000 - 200,000)",
          "Research Scientist (KSh 70,000 - 180,000)"
        ],
        salaryRange: "KSh 50,000 - 200,000",
        topUniversities: ["University of Nairobi", "Egerton University", "JKUAT", "Moi University"],
        steps: []
      }
    ]
  },
  {
    id: "education",
    title: "Education & Teaching",
    icon: BookOpen,
    description: "Educational careers shaping Kenya's future generations",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    marketDemand: "Medium",
    averageSalary: "KSh 35,000 - 150,000",
    courses: [
      {
        id: "education",
        title: "Bachelor of Education",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 7: 48+ points",
        description: "Professional teacher training for Kenyan schools",
        careerOpportunities: [
          "Primary Teacher (KSh 35,000 - 80,000)",
          "Secondary Teacher (KSh 45,000 - 100,000)",
          "Head Teacher (KSh 80,000 - 150,000)",
          "Education Officer (KSh 60,000 - 120,000)"
        ],
        salaryRange: "KSh 35,000 - 150,000",
        topUniversities: ["Kenyatta University", "Moi University", "Egerton University", "Maseno University"],
        steps: []
      }
    ]
  },
  {
    id: "creative-arts",
    title: "Creative Arts & Media",
    icon: Palette,
    description: "Creative careers in Kenya's growing entertainment industry",
    color: "bg-pink-50 border-pink-200 text-pink-800",
    marketDemand: "Medium",
    averageSalary: "KSh 40,000 - 200,000",
    courses: [
      {
        id: "fine-arts",
        title: "Bachelor of Fine Arts",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 8: 48+ points",
        description: "Creative arts and design for media and entertainment",
        careerOpportunities: [
          "Graphic Designer (KSh 40,000 - 100,000)",
          "Art Director (KSh 80,000 - 180,000)",
          "Media Producer (KSh 60,000 - 150,000)",
          "Creative Director (KSh 100,000 - 200,000)"
        ],
        salaryRange: "KSh 40,000 - 200,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Technical University of Kenya"],
        steps: []
      }
    ]
  }
];

const CareerPaths = () => {
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState<string>("health-medical");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'overview' | 'course-detail'>('overview');

  const currentField = careerFields.find(field => field.id === selectedField);
  const currentCourse = currentField?.courses.find(course => course.id === selectedCourse);

  const filteredFields = careerFields.filter(field =>
    field.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.courses.some(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setViewMode('course-detail');
  };

  const handleBackToOverview = () => {
    setSelectedCourse(null);
    setViewMode('overview');
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewMode === 'course-detail' && currentCourse) {
    return (
      <div className="p-3 md:p-8">
        {/* Course Detail Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToOverview}
            className="mb-4 hover:bg-muted"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Career Fields
          </Button>
          
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              {currentField && <currentField.icon className="w-8 h-8 text-primary" />}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{currentCourse.title}</h1>
              <p className="text-muted-foreground mb-4">{currentCourse.description}</p>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentCourse.duration}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {currentCourse.kcseRequirement}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {currentCourse.salaryRange}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Course Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Requirements & Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Entry Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-sm mb-2">KCSE Requirement</p>
                <Badge className="bg-blue-100 text-blue-800">{currentCourse.kcseRequirement}</Badge>
              </div>
              <div>
                <p className="font-medium text-sm mb-2">KUCCPS Cluster</p>
                <Badge className="bg-purple-100 text-purple-800">{currentCourse.clusterPoints}</Badge>
              </div>
              <div>
                <p className="font-medium text-sm mb-2">Top Universities</p>
                <div className="space-y-1">
                  {currentCourse.topUniversities.map((uni, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {uni}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Career Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentCourse.careerOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{opportunity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Career Roadmap */}
        {currentCourse.steps.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Career Roadmap
              </CardTitle>
              <CardDescription>
                Step-by-step path to success in {currentCourse.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentCourse.steps.map((step, index) => (
                  <div key={index} className="relative">
                    {index < currentCourse.steps.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-20 bg-border"></div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold">{index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{step.title}</h3>
                          <Badge variant="outline">{step.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-green-700">Requirements</h4>
                            <ul className="space-y-1">
                              {step.requirements.map((req, reqIndex) => (
                                <li key={reqIndex} className="text-xs flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-blue-700">Key Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {step.keySkills.map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Start Your Journey?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our career sessions to get personalized guidance from Kenyan professionals
            </p>
            <Button 
              variant="hero" 
              className="w-full md:w-auto"
              onClick={() => navigate('/dashboard/sessions')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Explore Career Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Kenya Career Paths</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4">
          Explore comprehensive career roadmaps based on Kenya's education system and job market
        </p>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search career fields or courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Career Fields Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredFields.map((field) => (
          <Card 
            key={field.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedField === field.id ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setSelectedField(field.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <field.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{field.title}</CardTitle>
                    <Badge className={`text-xs mt-1 ${getDemandColor(field.marketDemand)}`}>
                      {field.marketDemand} Demand
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">{field.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-green-600">{field.averageSalary}</span>
                <span className="text-muted-foreground">{field.courses.length} courses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Field Details */}
      {currentField && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <currentField.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentField.title}</CardTitle>
                <CardDescription>{currentField.description}</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge className={getDemandColor(currentField.marketDemand)}>
                {currentField.marketDemand} Market Demand
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {currentField.averageSalary}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {currentField.courses.length} Courses Available
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <h3 className="font-semibold mb-4">Available Courses</h3>
            <div className="grid gap-4">
              {currentField.courses.map((course) => (
                <Card 
                  key={course.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCourseSelect(course.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {course.duration}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        {course.kcseRequirement}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {course.salaryRange}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Top Universities: </span>
                      {course.topUniversities.slice(0, 2).join(", ")}
                      {course.topUniversities.length > 2 && ` +${course.topUniversities.length - 2} more`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerPaths;