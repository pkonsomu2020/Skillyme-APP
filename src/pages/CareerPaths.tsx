import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Target
} from "lucide-react";

interface CareerStep {
  title: string;
  duration: string;
  description: string;
  requirements: string[];
  keySkills: string[];
  isCompleted?: boolean;
}

interface CareerPath {
  id: string;
  title: string;
  icon: any;
  description: string;
  averageSalary: string;
  jobOutlook: string;
  totalDuration: string;
  steps: CareerStep[];
  specializations: string[];
  keyStats: {
    averageStartingSalary: string;
    experiencedSalary: string;
    jobGrowth: string;
    workEnvironment: string[];
  };
}

const careerPaths: CareerPath[] = [
  {
    id: "medicine",
    title: "Medicine & Healthcare",
    icon: Stethoscope,
    description: "Become a medical doctor and save lives while making a significant impact on healthcare and society.",
    averageSalary: "$200,000 - $500,000+",
    jobOutlook: "Excellent (7% growth)",
    totalDuration: "11-16 years",
    steps: [
      {
        title: "Undergraduate Degree",
        duration: "4 years",
        description: "Complete a bachelor's degree with strong science foundation. While any major is acceptable, focus on prerequisite courses.",
        requirements: [
          "Bachelor's degree (any major)",
          "Biology (1 year with lab)",
          "General Chemistry (1 year with lab)", 
          "Organic Chemistry (1 year with lab)",
          "Physics (1 year with lab)",
          "Mathematics (1 year)",
          "English (1 year)"
        ],
        keySkills: [
          "Strong GPA (3.5+ competitive)",
          "Scientific reasoning",
          "Research experience",
          "Volunteer work in healthcare",
          "Leadership activities"
        ]
      },
      {
        title: "MCAT Preparation & Medical School Application",
        duration: "1 year",
        description: "Prepare for and take the Medical College Admission Test (MCAT). Apply to medical schools through AMCAS.",
        requirements: [
          "MCAT score (competitive: 510+)",
          "Medical school applications",
          "Personal statement",
          "Letters of recommendation",
          "Medical school interviews"
        ],
        keySkills: [
          "Test-taking strategies",
          "Interview skills",
          "Communication abilities",
          "Time management",
          "Stress management"
        ]
      },
      {
        title: "Medical School",
        duration: "4 years",
        description: "Intensive medical education combining classroom learning with clinical rotations in various specialties.",
        requirements: [
          "Complete medical curriculum",
          "Pass USMLE Step 1",
          "Pass USMLE Step 2 CK & CS",
          "Clinical rotations",
          "Research projects"
        ],
        keySkills: [
          "Medical knowledge",
          "Clinical skills",
          "Patient communication",
          "Diagnostic reasoning",
          "Professional ethics"
        ]
      },
      {
        title: "Residency Training",
        duration: "3-7 years",
        description: "Specialized training in chosen medical specialty under supervision of experienced physicians.",
        requirements: [
          "Match into residency program",
          "Complete residency requirements",
          "Pass USMLE Step 3",
          "Board certification exam",
          "Continuous medical education"
        ],
        keySkills: [
          "Specialty expertise",
          "Surgical skills (if applicable)",
          "Emergency medicine",
          "Patient management",
          "Teaching abilities"
        ]
      },
      {
        title: "Fellowship (Optional)",
        duration: "1-3 years",
        description: "Additional subspecialty training for highly specialized areas of medicine.",
        requirements: [
          "Complete residency",
          "Fellowship application",
          "Subspecialty training",
          "Board certification in subspecialty"
        ],
        keySkills: [
          "Advanced subspecialty knowledge",
          "Research capabilities",
          "Innovation in medicine",
          "Leadership in healthcare"
        ]
      }
    ],
    specializations: [
      "Internal Medicine",
      "Surgery", 
      "Pediatrics",
      "Psychiatry",
      "Radiology",
      "Emergency Medicine",
      "Cardiology",
      "Neurology",
      "Oncology",
      "Anesthesiology"
    ],
    keyStats: {
      averageStartingSalary: "$200,000",
      experiencedSalary: "$300,000 - $500,000+",
      jobGrowth: "7% (Faster than average)",
      workEnvironment: ["Hospitals", "Clinics", "Private Practice", "Research Institutions"]
    }
  },
  {
    id: "law",
    title: "Law & Legal Practice",
    icon: Scale,
    description: "Advocate for justice, represent clients, and navigate the complex world of legal systems and regulations.",
    averageSalary: "$80,000 - $200,000+",
    jobOutlook: "Good (5% growth)",
    totalDuration: "7-8 years",
    steps: [
      {
        title: "Undergraduate Degree",
        duration: "4 years",
        description: "Complete a bachelor's degree in any field. Popular pre-law majors include Political Science, History, English, and Philosophy.",
        requirements: [
          "Bachelor's degree (any major)",
          "High GPA (3.5+ competitive)",
          "Strong writing skills",
          "Critical thinking development",
          "Liberal arts foundation"
        ],
        keySkills: [
          "Analytical reasoning",
          "Written communication",
          "Research abilities",
          "Public speaking",
          "Logical argumentation"
        ]
      },
      {
        title: "LSAT Preparation & Law School Application",
        duration: "1 year",
        description: "Prepare for the Law School Admission Test (LSAT) and apply to law schools through LSAC.",
        requirements: [
          "LSAT score (competitive: 160+)",
          "Law school applications",
          "Personal statement",
          "Letters of recommendation",
          "Law school interviews"
        ],
        keySkills: [
          "Logical reasoning",
          "Reading comprehension",
          "Analytical writing",
          "Time management",
          "Test strategy"
        ]
      },
      {
        title: "Law School (Juris Doctor)",
        duration: "3 years",
        description: "Intensive legal education covering constitutional law, contracts, torts, criminal law, and specialized areas.",
        requirements: [
          "Complete JD curriculum",
          "Maintain good academic standing",
          "Participate in moot court/mock trial",
          "Complete internships/externships",
          "Law review participation (optional)"
        ],
        keySkills: [
          "Legal research and writing",
          "Case analysis",
          "Oral advocacy",
          "Client counseling",
          "Professional ethics"
        ]
      },
      {
        title: "Bar Examination & Licensing",
        duration: "6 months",
        description: "Pass the bar examination in the state where you plan to practice law and complete character and fitness evaluation.",
        requirements: [
          "Pass state bar examination",
          "Character and fitness evaluation",
          "Continuing legal education",
          "State bar admission",
          "Professional liability insurance"
        ],
        keySkills: [
          "State-specific law knowledge",
          "Professional responsibility",
          "Client relations",
          "Practice management",
          "Ethical decision-making"
        ]
      },
      {
        title: "Legal Practice & Specialization",
        duration: "Ongoing",
        description: "Begin practicing law and develop expertise in specific areas through experience and additional certifications.",
        requirements: [
          "Join law firm or start practice",
          "Develop client base",
          "Specialize in practice areas",
          "Continuing education",
          "Professional development"
        ],
        keySkills: [
          "Client development",
          "Case management",
          "Negotiation",
          "Trial advocacy",
          "Business development"
        ]
      }
    ],
    specializations: [
      "Corporate Law",
      "Criminal Law",
      "Family Law",
      "Personal Injury",
      "Real Estate Law",
      "Immigration Law",
      "Intellectual Property",
      "Environmental Law",
      "Tax Law",
      "Employment Law"
    ],
    keyStats: {
      averageStartingSalary: "$80,000",
      experiencedSalary: "$120,000 - $200,000+",
      jobGrowth: "5% (As fast as average)",
      workEnvironment: ["Law Firms", "Government", "Corporations", "Non-profits"]
    }
  },
  {
    id: "computer-science",
    title: "Computer Science & Technology",
    icon: Code,
    description: "Build the future through software development, artificial intelligence, and cutting-edge technology solutions.",
    averageSalary: "$70,000 - $150,000+",
    jobOutlook: "Excellent (13% growth)",
    totalDuration: "4-6 years",
    steps: [
      {
        title: "Computer Science Degree",
        duration: "4 years",
        description: "Complete a bachelor's degree in Computer Science, Software Engineering, or related field with strong programming foundation.",
        requirements: [
          "Bachelor's in Computer Science/related field",
          "Programming languages (Python, Java, C++)",
          "Data structures and algorithms",
          "Computer systems and architecture",
          "Mathematics (Calculus, Statistics)"
        ],
        keySkills: [
          "Programming proficiency",
          "Problem-solving",
          "Logical thinking",
          "Software design",
          "Version control (Git)"
        ]
      },
      {
        title: "Skill Development & Projects",
        duration: "Ongoing",
        description: "Build a strong portfolio through personal projects, internships, and open-source contributions.",
        requirements: [
          "Personal coding projects",
          "GitHub portfolio",
          "Internship experience",
          "Technical certifications",
          "Coding bootcamps (optional)"
        ],
        keySkills: [
          "Full-stack development",
          "Database management",
          "Web technologies",
          "Mobile development",
          "Cloud platforms"
        ]
      },
      {
        title: "Entry-Level Position",
        duration: "1-2 years",
        description: "Start as Junior Developer, Software Engineer, or similar role to gain professional experience.",
        requirements: [
          "Technical interviews",
          "Coding assessments",
          "Portfolio demonstration",
          "Professional references",
          "Continuous learning"
        ],
        keySkills: [
          "Code review",
          "Agile methodologies",
          "Team collaboration",
          "Testing and debugging",
          "Documentation"
        ]
      },
      {
        title: "Mid-Level Development",
        duration: "2-4 years",
        description: "Advance to mid-level positions with increased responsibilities and technical leadership opportunities.",
        requirements: [
          "2-4 years experience",
          "Technical leadership",
          "Mentoring junior developers",
          "Architecture decisions",
          "Specialized expertise"
        ],
        keySkills: [
          "System design",
          "Performance optimization",
          "Security best practices",
          "Project management",
          "Technical communication"
        ]
      },
      {
        title: "Senior Level & Specialization",
        duration: "Ongoing",
        description: "Become a senior engineer, tech lead, or specialize in areas like AI, cybersecurity, or data science.",
        requirements: [
          "5+ years experience",
          "Technical expertise",
          "Leadership skills",
          "Strategic thinking",
          "Industry recognition"
        ],
        keySkills: [
          "Advanced system architecture",
          "Team leadership",
          "Technology strategy",
          "Innovation",
          "Cross-functional collaboration"
        ]
      }
    ],
    specializations: [
      "Software Development",
      "Data Science",
      "Artificial Intelligence",
      "Cybersecurity",
      "Mobile Development",
      "Web Development",
      "DevOps Engineering",
      "Game Development",
      "Blockchain",
      "Cloud Computing"
    ],
    keyStats: {
      averageStartingSalary: "$70,000",
      experiencedSalary: "$100,000 - $150,000+",
      jobGrowth: "13% (Much faster than average)",
      workEnvironment: ["Tech Companies", "Startups", "Corporations", "Remote Work"]
    }
  }
];

const CareerPaths = () => {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<string>("medicine");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const currentPath = careerPaths.find(path => path.id === selectedPath);

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  return (
    <div className="p-3 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Career Paths</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Explore detailed roadmaps for Medicine, Law, and Computer Science careers
        </p>
      </div>

      <Tabs value={selectedPath} onValueChange={setSelectedPath} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 h-auto">
          {careerPaths.map((path) => (
            <TabsTrigger 
              key={path.id} 
              value={path.id} 
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm"
            >
              <path.icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-center leading-tight">{path.title.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {currentPath && (
          <TabsContent value={selectedPath} className="mt-0">
            {/* Career Overview */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <currentPath.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl md:text-2xl mb-2">{currentPath.title}</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      {currentPath.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Salary Range</p>
                    <p className="font-semibold text-sm">{currentPath.averageSalary}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Job Outlook</p>
                    <p className="font-semibold text-sm">{currentPath.jobOutlook}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Total Duration</p>
                    <p className="font-semibold text-sm">{currentPath.totalDuration}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Steps</p>
                    <p className="font-semibold text-sm">{currentPath.steps.length} Phases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career Steps Roadmap */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Career Roadmap
                </CardTitle>
                <CardDescription>
                  Follow this step-by-step path to build your career in {currentPath.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPath.steps.map((step, index) => (
                    <div key={index} className="relative">
                      {/* Timeline connector */}
                      {index < currentPath.steps.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                      )}
                      
                      <div 
                        className="flex gap-4 cursor-pointer hover:bg-muted/30 p-3 rounded-lg transition-colors"
                        onClick={() => toggleStep(index)}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm md:text-base">{step.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          
                          {expandedStep === index && (
                            <div className="mt-4 space-y-4 border-t pt-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Requirements
                                </h4>
                                <ul className="space-y-1">
                                  {step.requirements.map((req, reqIndex) => (
                                    <li key={reqIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                  <Award className="w-4 h-4 text-blue-600" />
                                  Key Skills to Develop
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {step.keySkills.map((skill, skillIndex) => (
                                    <Badge key={skillIndex} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specializations and Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Specializations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Popular Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {currentPath.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="justify-center p-2 text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Career Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Starting Salary</p>
                    <p className="text-lg font-bold text-green-600">{currentPath.keyStats.averageStartingSalary}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Experienced Salary</p>
                    <p className="text-lg font-bold text-green-600">{currentPath.keyStats.experiencedSalary}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Job Growth Rate</p>
                    <p className="text-sm text-blue-600">{currentPath.keyStats.jobGrowth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Work Environment</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentPath.keyStats.workEnvironment.map((env, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Ready to Start Your Journey?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our career sessions to get personalized guidance from industry professionals
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CareerPaths;