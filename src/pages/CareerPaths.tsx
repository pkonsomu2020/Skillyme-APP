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
          },
          {
            title: "Nursing School",
            duration: "4 years",
            description: "Comprehensive nursing education with clinical practice",
            requirements: [
              "Complete nursing curriculum",
              "Clinical rotations in hospitals",
              "Pass nursing examinations",
              "Community health practice"
            ],
            keySkills: ["Patient care", "Medical procedures", "Health assessment", "Communication"],
            kcseGrade: "Maintained performance",
            clusterPoints: "University requirements"
          },
          {
            title: "Nursing Council Registration",
            duration: "6 months",
            description: "Register with Nursing Council of Kenya for practice license",
            requirements: [
              "Pass Nursing Council exams",
              "Complete internship",
              "Professional registration",
              "Continuous professional development"
            ],
            keySkills: ["Professional ethics", "Clinical competence", "Leadership"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          }
        ]
      },
      {
        id: "pharmacy",
        title: "Bachelor of Pharmacy",
        duration: "5 years",
        kcseRequirement: "A- (80+ points)",
        clusterPoints: "Cluster 2A: 80+ points",
        description: "Pharmaceutical sciences and drug dispensing practice",
        careerOpportunities: [
          "Community Pharmacist (KSh 80,000 - 180,000)",
          "Hospital Pharmacist (KSh 100,000 - 220,000)",
          "Industrial Pharmacist (KSh 120,000 - 300,000)",
          "Regulatory Affairs Officer (KSh 150,000 - 350,000)"
        ],
        salaryRange: "KSh 80,000 - 350,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University"],
        steps: []
      },
      {
        id: "clinical-medicine",
        title: "Bachelor of Clinical Medicine",
        duration: "5 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 2B: 70+ points",
        description: "Clinical officer training for primary healthcare delivery",
        careerOpportunities: [
          "Clinical Officer (KSh 70,000 - 150,000)",
          "Senior Clinical Officer (KSh 100,000 - 200,000)",
          "Public Health Officer (KSh 80,000 - 180,000)",
          "Healthcare Administrator (KSh 120,000 - 250,000)"
        ],
        salaryRange: "KSh 70,000 - 250,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University", "KMTC"],
        steps: []
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
          },
          {
            title: "Law School",
            duration: "4 years",
            description: "Comprehensive legal education covering Kenyan and international law",
            requirements: [
              "Complete LL.B curriculum",
              "Constitutional Law, Contract Law, Tort Law",
              "Criminal Law, Commercial Law",
              "Legal research and writing",
              "Moot court participation"
            ],
            keySkills: ["Legal research", "Case analysis", "Oral advocacy", "Legal writing"],
            kcseGrade: "Maintained performance",
            clusterPoints: "University requirements"
          },
          {
            title: "Kenya School of Law",
            duration: "1 year",
            description: "Postgraduate diploma for admission to the bar",
            requirements: [
              "Complete Postgraduate Diploma in Law",
              "Practical legal training",
              "Court attachments",
              "Legal clinic work"
            ],
            keySkills: ["Practical law", "Client handling", "Court procedures"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          },
          {
            title: "Admission to the Bar",
            duration: "6 months",
            description: "Admission as an Advocate of the High Court of Kenya",
            requirements: [
              "Pass Kenya School of Law exams",
              "Character and fitness evaluation",
              "Law Society of Kenya membership",
              "Practicing certificate"
            ],
            keySkills: ["Professional ethics", "Legal practice", "Client relations"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          }
        ]
      },
      {
        id: "criminology",
        title: "Bachelor of Arts in Criminology",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 1: 48+ points",
        description: "Study of crime, criminal behavior, and justice systems",
        careerOpportunities: [
          "Police Officer (KSh 45,000 - 120,000)",
          "Criminal Investigator (KSh 60,000 - 150,000)",
          "Probation Officer (KSh 50,000 - 130,000)",
          "Security Consultant (KSh 80,000 - 200,000)"
        ],
        salaryRange: "KSh 45,000 - 200,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University"],
        steps: []
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
      },
      {
        id: "mechanical-engineering",
        title: "Bachelor of Mechanical Engineering",
        duration: "5 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 3: 70+ points",
        description: "Design and manufacturing of mechanical systems",
        careerOpportunities: [
          "Mechanical Engineer (KSh 90,000 - 280,000)",
          "Manufacturing Engineer (KSh 100,000 - 250,000)",
          "Project Engineer (KSh 120,000 - 350,000)",
          "Maintenance Manager (KSh 150,000 - 400,000)"
        ],
        salaryRange: "KSh 90,000 - 400,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Moi University", "Technical University of Kenya"],
        steps: []
      },
      {
        id: "electrical-engineering",
        title: "Bachelor of Electrical Engineering",
        duration: "5 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 3: 70+ points",
        description: "Electrical systems, power generation, and electronics",
        careerOpportunities: [
          "Electrical Engineer (KSh 85,000 - 270,000)",
          "Power Systems Engineer (KSh 120,000 - 350,000)",
          "Control Systems Engineer (KSh 100,000 - 300,000)",
          "Telecommunications Engineer (KSh 90,000 - 280,000)"
        ],
        salaryRange: "KSh 85,000 - 350,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Moi University", "Technical University of Kenya"],
        steps: []
      },
      {
        id: "computer-engineering",
        title: "Bachelor of Computer Engineering",
        duration: "5 years",
        kcseRequirement: "B+ (70+ points)",
        clusterPoints: "Cluster 3: 70+ points",
        description: "Hardware and software integration for computing systems",
        careerOpportunities: [
          "Computer Engineer (KSh 80,000 - 250,000)",
          "Systems Engineer (KSh 100,000 - 300,000)",
          "Hardware Engineer (KSh 90,000 - 280,000)",
          "Embedded Systems Engineer (KSh 110,000 - 320,000)"
        ],
        salaryRange: "KSh 80,000 - 320,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Strathmore University", "Technical University of Kenya"],
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
        steps: [
          {
            title: "KCSE Achievement",
            duration: "Form 4",
            description: "Meet minimum requirements for business studies admission",
            requirements: [
              "KCSE Mean Grade C+ (48+ points)",
              "Mathematics C+ (7+ points)",
              "English C+ (7+ points)",
              "Kiswahili C+ (7+ points)",
              "Any other subject C+ (7+ points)"
            ],
            keySkills: ["Numerical skills", "Communication", "Critical thinking", "Leadership potential"],
            kcseGrade: "C+ (48+ points)",
            clusterPoints: "Cluster 4: 48+"
          },
          {
            title: "Business Degree Program",
            duration: "4 years",
            description: "Comprehensive business education covering all aspects of management",
            requirements: [
              "Complete business core subjects",
              "Management, Marketing, Finance, HR",
              "Business law and economics",
              "Internship/attachment program",
              "Business plan project"
            ],
            keySkills: ["Business analysis", "Strategic thinking", "Leadership", "Financial literacy"],
            kcseGrade: "Maintained performance",
            clusterPoints: "University requirements"
          },
          {
            title: "Professional Development",
            duration: "Ongoing",
            description: "Build career through experience and professional certifications",
            requirements: [
              "Entry-level management position",
              "Professional certifications (CPA, CHRM)",
              "Networking and industry connections",
              "Continuous professional development"
            ],
            keySkills: ["Management", "Business development", "Networking", "Professional ethics"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          }
        ]
      },
      {
        id: "accounting",
        title: "Bachelor of Commerce (Accounting)",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 4: 48+ points",
        description: "Financial accounting, auditing, and business finance",
        careerOpportunities: [
          "Accountant (KSh 60,000 - 180,000)",
          "Auditor (KSh 80,000 - 220,000)",
          "Financial Analyst (KSh 90,000 - 250,000)",
          "Chief Financial Officer (KSh 200,000 - 500,000)"
        ],
        salaryRange: "KSh 60,000 - 500,000",
        topUniversities: ["University of Nairobi", "Strathmore University", "USIU", "KCA University"],
        steps: []
      },
      {
        id: "economics",
        title: "Bachelor of Arts in Economics",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 4: 48+ points",
        description: "Economic theory, policy analysis, and market research",
        careerOpportunities: [
          "Economist (KSh 70,000 - 200,000)",
          "Policy Analyst (KSh 80,000 - 220,000)",
          "Market Research Analyst (KSh 60,000 - 180,000)",
          "Development Officer (KSh 90,000 - 250,000)"
        ],
        salaryRange: "KSh 60,000 - 250,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Strathmore University"],
        steps: []
      },
      {
        id: "finance",
        title: "Bachelor of Science in Finance",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 4: 48+ points",
        description: "Corporate finance, investment analysis, and banking",
        careerOpportunities: [
          "Financial Advisor (KSh 70,000 - 200,000)",
          "Investment Analyst (KSh 90,000 - 280,000)",
          "Bank Manager (KSh 120,000 - 350,000)",
          "Portfolio Manager (KSh 150,000 - 400,000)"
        ],
        salaryRange: "KSh 70,000 - 400,000",
        topUniversities: ["Strathmore University", "USIU", "University of Nairobi", "KCA University"],
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
        steps: [
          {
            title: "KCSE Excellence",
            duration: "Form 4",
            description: "Achieve strong grades in mathematics and sciences for computer science admission",
            requirements: [
              "KCSE Mean Grade B- (60+ points)",
              "Mathematics B+ (10+ points)",
              "Physics B (9+ points)",
              "Chemistry/Biology B (9+ points)",
              "English B+ (10+ points)"
            ],
            keySkills: ["Mathematical reasoning", "Logical thinking", "Problem-solving", "English proficiency"],
            kcseGrade: "B- (60+ points)",
            clusterPoints: "Cluster 5: 60+"
          },
          {
            title: "University Computer Science Program",
            duration: "4 years",
            description: "Comprehensive computer science education with programming and system design",
            requirements: [
              "Complete core CS curriculum",
              "Programming languages (Java, Python, C++)",
              "Data structures and algorithms",
              "Database systems and software engineering",
              "Final year project"
            ],
            keySkills: ["Programming", "Software development", "System analysis", "Database design"],
            kcseGrade: "Maintained performance",
            clusterPoints: "University requirements"
          },
          {
            title: "Industry Experience & Specialization",
            duration: "1-2 years",
            description: "Gain practical experience through internships and entry-level positions",
            requirements: [
              "Complete internship programs",
              "Build portfolio of projects",
              "Learn industry tools and frameworks",
              "Obtain relevant certifications"
            ],
            keySkills: ["Industry tools", "Team collaboration", "Project management", "Continuous learning"],
            kcseGrade: "N/A",
            clusterPoints: "N/A"
          }
        ]
      },
      {
        id: "information-technology",
        title: "Bachelor of Science in Information Technology",
        duration: "4 years",
        kcseRequirement: "B- (60+ points)",
        clusterPoints: "Cluster 5: 60+ points",
        description: "IT systems, network administration, and cybersecurity",
        careerOpportunities: [
          "IT Specialist (KSh 65,000 - 180,000)",
          "Network Administrator (KSh 70,000 - 200,000)",
          "Cybersecurity Analyst (KSh 90,000 - 250,000)",
          "IT Manager (KSh 120,000 - 300,000)"
        ],
        salaryRange: "KSh 65,000 - 300,000",
        topUniversities: ["Strathmore University", "JKUAT", "University of Nairobi", "KCA University"],
        steps: []
      },
      {
        id: "software-engineering",
        title: "Bachelor of Software Engineering",
        duration: "4 years",
        kcseRequirement: "B- (60+ points)",
        clusterPoints: "Cluster 5: 60+ points",
        description: "Software development, programming, and system design",
        careerOpportunities: [
          "Software Developer (KSh 70,000 - 220,000)",
          "Full Stack Developer (KSh 80,000 - 250,000)",
          "Software Architect (KSh 120,000 - 350,000)",
          "Technical Lead (KSh 150,000 - 400,000)"
        ],
        salaryRange: "KSh 70,000 - 400,000",
        topUniversities: ["Strathmore University", "JKUAT", "University of Nairobi", "Multimedia University"],
        steps: []
      },
      {
        id: "data-science",
        title: "Bachelor of Science in Data Science",
        duration: "4 years",
        kcseRequirement: "B- (60+ points)",
        clusterPoints: "Cluster 5: 60+ points",
        description: "Big data analytics, machine learning, and statistical analysis",
        careerOpportunities: [
          "Data Scientist (KSh 90,000 - 280,000)",
          "Data Analyst (KSh 70,000 - 200,000)",
          "Machine Learning Engineer (KSh 100,000 - 320,000)",
          "Business Intelligence Analyst (KSh 80,000 - 240,000)"
        ],
        salaryRange: "KSh 70,000 - 320,000",
        topUniversities: ["Strathmore University", "University of Nairobi", "JKUAT", "USIU"],
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
      },
      {
        id: "agricultural-economics",
        title: "Bachelor of Agricultural Economics",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 6: 48+ points",
        description: "Agricultural business, farm management, and rural development",
        careerOpportunities: [
          "Agricultural Economist (KSh 60,000 - 180,000)",
          "Farm Business Advisor (KSh 70,000 - 160,000)",
          "Agricultural Credit Officer (KSh 55,000 - 140,000)",
          "Rural Development Officer (KSh 65,000 - 170,000)"
        ],
        salaryRange: "KSh 55,000 - 180,000",
        topUniversities: ["Egerton University", "University of Nairobi", "JKUAT", "Moi University"],
        steps: []
      },
      {
        id: "veterinary-medicine",
        title: "Bachelor of Veterinary Medicine",
        duration: "6 years",
        kcseRequirement: "A- (80+ points)",
        clusterPoints: "Cluster 6A: 80+ points",
        description: "Animal health, livestock management, and veterinary practice",
        careerOpportunities: [
          "Veterinarian (KSh 80,000 - 250,000)",
          "Livestock Officer (KSh 60,000 - 150,000)",
          "Veterinary Consultant (KSh 100,000 - 300,000)",
          "Animal Health Inspector (KSh 70,000 - 180,000)"
        ],
        salaryRange: "KSh 60,000 - 300,000",
        topUniversities: ["University of Nairobi", "Egerton University"],
        steps: []
      },
      {
        id: "food-science",
        title: "Bachelor of Food Science & Technology",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 6: 48+ points",
        description: "Food processing, quality control, and nutrition",
        careerOpportunities: [
          "Food Technologist (KSh 65,000 - 180,000)",
          "Quality Control Manager (KSh 80,000 - 220,000)",
          "Food Safety Inspector (KSh 60,000 - 160,000)",
          "Product Development Manager (KSh 90,000 - 250,000)"
        ],
        salaryRange: "KSh 60,000 - 250,000",
        topUniversities: ["University of Nairobi", "JKUAT", "Egerton University"],
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
      },
      {
        id: "early-childhood-education",
        title: "Bachelor of Early Childhood Development Education",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 7: 48+ points",
        description: "Early childhood development and pre-primary education",
        careerOpportunities: [
          "ECD Teacher (KSh 30,000 - 70,000)",
          "ECD Center Manager (KSh 50,000 - 120,000)",
          "Child Development Specialist (KSh 60,000 - 140,000)",
          "Education Officer (KSh 70,000 - 150,000)"
        ],
        salaryRange: "KSh 30,000 - 150,000",
        topUniversities: ["Kenyatta University", "Moi University", "Mount Kenya University"],
        steps: []
      },
      {
        id: "special-needs-education",
        title: "Bachelor of Special Needs Education",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 7: 48+ points",
        description: "Education for learners with special needs and disabilities",
        careerOpportunities: [
          "Special Needs Teacher (KSh 40,000 - 90,000)",
          "Special Education Coordinator (KSh 60,000 - 130,000)",
          "Rehabilitation Specialist (KSh 70,000 - 160,000)",
          "Inclusive Education Consultant (KSh 80,000 - 180,000)"
        ],
        salaryRange: "KSh 40,000 - 180,000",
        topUniversities: ["Kenyatta University", "Moi University", "Maseno University"],
        steps: []
      },
      {
        id: "educational-psychology",
        title: "Bachelor of Educational Psychology",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 7: 48+ points",
        description: "Psychology applied to learning and educational settings",
        careerOpportunities: [
          "Educational Psychologist (KSh 70,000 - 180,000)",
          "School Counselor (KSh 50,000 - 120,000)",
          "Learning Support Specialist (KSh 60,000 - 150,000)",
          "Educational Consultant (KSh 80,000 - 200,000)"
        ],
        salaryRange: "KSh 50,000 - 200,000",
        topUniversities: ["Kenyatta University", "University of Nairobi", "Moi University"],
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
      },
      {
        id: "journalism",
        title: "Bachelor of Arts in Journalism",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 8: 48+ points",
        description: "Media, broadcasting, and digital journalism",
        careerOpportunities: [
          "Journalist (KSh 45,000 - 120,000)",
          "News Anchor (KSh 80,000 - 250,000)",
          "Media Producer (KSh 60,000 - 180,000)",
          "Editor (KSh 70,000 - 200,000)"
        ],
        salaryRange: "KSh 45,000 - 250,000",
        topUniversities: ["University of Nairobi", "Moi University", "Daystar University"],
        steps: []
      },
      {
        id: "film-production",
        title: "Bachelor of Film and Television Production",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 8: 48+ points",
        description: "Film making, video production, and digital media",
        careerOpportunities: [
          "Film Director (KSh 60,000 - 200,000)",
          "Video Producer (KSh 50,000 - 150,000)",
          "Cinematographer (KSh 70,000 - 180,000)",
          "Film Editor (KSh 55,000 - 140,000)"
        ],
        salaryRange: "KSh 50,000 - 200,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "USIU"],
        steps: []
      },
      {
        id: "graphic-design",
        title: "Bachelor of Graphic Design",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 8: 48+ points",
        description: "Visual communication, branding, and digital design",
        careerOpportunities: [
          "Graphic Designer (KSh 40,000 - 120,000)",
          "Brand Designer (KSh 60,000 - 160,000)",
          "UI/UX Designer (KSh 70,000 - 200,000)",
          "Creative Director (KSh 100,000 - 250,000)"
        ],
        salaryRange: "KSh 40,000 - 250,000",
        topUniversities: ["University of Nairobi", "Technical University of Kenya", "USIU"],
        steps: []
      }
    ]
  },
  {
    id: "social-sciences",
    title: "Social Sciences & Humanities",
    icon: Users,
    description: "Understanding society, culture, and human behavior",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
    marketDemand: "Medium",
    averageSalary: "KSh 40,000 - 180,000",
    courses: [
      {
        id: "psychology",
        title: "Bachelor of Arts in Psychology",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 9: 48+ points",
        description: "Human behavior, mental health, and psychological research",
        careerOpportunities: [
          "Psychologist (KSh 60,000 - 180,000)",
          "Counselor (KSh 50,000 - 130,000)",
          "Human Resources Specialist (KSh 70,000 - 160,000)",
          "Research Analyst (KSh 65,000 - 150,000)"
        ],
        salaryRange: "KSh 50,000 - 180,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University", "USIU"],
        steps: []
      },
      {
        id: "sociology",
        title: "Bachelor of Arts in Sociology",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 9: 48+ points",
        description: "Society, social institutions, and community development",
        careerOpportunities: [
          "Social Worker (KSh 45,000 - 120,000)",
          "Community Development Officer (KSh 55,000 - 140,000)",
          "Social Researcher (KSh 60,000 - 150,000)",
          "NGO Program Manager (KSh 80,000 - 200,000)"
        ],
        salaryRange: "KSh 45,000 - 200,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University"],
        steps: []
      },
      {
        id: "political-science",
        title: "Bachelor of Arts in Political Science",
        duration: "4 years",
        kcseRequirement: "C+ (48+ points)",
        clusterPoints: "Cluster 9: 48+ points",
        description: "Government, politics, and public administration",
        careerOpportunities: [
          "Political Analyst (KSh 60,000 - 160,000)",
          "Public Administrator (KSh 70,000 - 180,000)",
          "Diplomat (KSh 100,000 - 300,000)",
          "Policy Researcher (KSh 65,000 - 170,000)"
        ],
        salaryRange: "KSh 60,000 - 300,000",
        topUniversities: ["University of Nairobi", "Kenyatta University", "Moi University"],
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
  const [demandFilter, setDemandFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const currentField = careerFields.find(field => field.id === selectedField);
  const currentCourse = selectedCourse ? 
    careerFields.flatMap(field => field.courses).find(course => course.id === selectedCourse) : null;
  const currentCourseField = selectedCourse ? 
    careerFields.find(field => field.courses.some(course => course.id === selectedCourse)) : null;

  const filteredFields = careerFields.filter(field => {
    const matchesSearch = field.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.courses.some(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesDemand = demandFilter === 'All' || field.marketDemand === demandFilter;
    
    return matchesSearch && matchesDemand;
  });

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setViewMode('course-detail');
    // Scroll to top when showing course details
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOverview = () => {
    setSelectedCourse(null);
    setViewMode('overview');
  };

  const handleBackToTop = () => {
    setSelectedCourse(null);
    // Smooth scroll back to top
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewMode === 'course-detail' && currentCourse && currentCourseField) {
    return (
      <div className="p-3 md:p-8">
        {/* Course Detail Header */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Career Paths</span>
            <ChevronRight className="w-4 h-4" />
            <span>{currentCourseField?.title}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{currentCourse.title}</span>
          </div>
          
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
              {currentCourseField && <currentCourseField.icon className="w-8 h-8 text-primary" />}
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
        {currentCourse.steps.length > 0 ? (
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
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                General Career Path
              </CardTitle>
              <CardDescription>
                Standard progression for {currentCourse.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">1</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">KCSE Preparation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Achieve the required KCSE grade of {currentCourse.kcseRequirement} to qualify for university admission.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {currentCourse.clusterPoints}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">2</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">University Education</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete your {currentCourse.duration} degree program at one of Kenya's top universities.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {currentCourse.topUniversities.slice(0, 3).map((uni, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {uni}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">3</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Career Development</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start your career and grow through experience, with salary potential of {currentCourse.salaryRange}.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {currentCourse.careerOpportunities.slice(0, 2).map((opportunity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {opportunity.split(' (')[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
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
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{careerFields.length}</p>
            <p className="text-xs text-muted-foreground">Career Fields</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {careerFields.reduce((total, field) => total + field.courses.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {careerFields.filter(field => field.marketDemand === 'High').length}
            </p>
            <p className="text-xs text-muted-foreground">High Demand Fields</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">C+ to A-</p>
            <p className="text-xs text-muted-foreground">KCSE Range</p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search career fields or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={demandFilter === 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemandFilter('All')}
            >
              All Fields
            </Button>
            <Button
              variant={demandFilter === 'High' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemandFilter('High')}
              className="text-green-700 border-green-200 hover:bg-green-50"
            >
              High Demand
            </Button>
            <Button
              variant={demandFilter === 'Medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemandFilter('Medium')}
              className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
            >
              Medium
            </Button>
          </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Available Courses</h3>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                💡 Click any course for detailed information
              </Badge>
            </div>
            <div className="grid gap-4">
              {currentField.courses.map((course) => (
                <Card 
                  key={course.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-primary/20 hover:border-l-primary"
                  onClick={() => handleCourseSelect(course.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1 text-primary hover:text-primary/80">
                          {course.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Click for Details
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
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