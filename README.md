# 🚀 Skillyme - Career Connection Platform

> **Connecting ambitious students with industry professionals through interactive career sessions**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://mysql.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-cyan.svg)](https://tailwindcss.com/)

## 📖 **Overview**

Skillyme is a comprehensive career connection platform designed to bridge the gap between ambitious students and industry professionals. Our platform facilitates meaningful career guidance through interactive sessions, networking opportunities, and direct access to recruiters and mentors.

### 🎯 **Mission**
To empower the next generation of professionals by providing direct access to industry experts, career guidance, and networking opportunities that accelerate career development.

### 🌟 **Vision**
To become the leading career connection platform in Kenya and Africa, connecting millions of students with industry professionals across various sectors.

## 🏗️ **Architecture**

### **Frontend Applications**
- **Main Application** (`/`): User-facing platform for students

### **Backend API**
- **RESTful API**: Node.js/Express.js backend
- **Database**: MySQL with comprehensive schema
- **Authentication**: JWT-based with enhanced security

## 🚀 **Key Features**

### 👥 **For Students**

#### **🔐 Secure Authentication**
- **User Registration**: Comprehensive signup with validation
- **Login System**: Secure JWT-based authentication
- **Password Recovery**: Complete forgot password system
- **Profile Management**: Personal information and preferences

#### **📚 Career Sessions**
- **Interactive Sessions**: Live career guidance sessions
- **Industry Experts**: Direct access to professionals
- **Session Booking**: Easy registration and payment
- **Google Meet Integration**: Seamless video conferencing

#### **💳 Payment System**
- **M-Pesa Integration**: Secure mobile payment processing
- **Email Notifications**: Automated payment confirmations
- **Google Meet Links**: Automatic session access delivery

#### **📊 Dashboard**
- **Personal Dashboard**: Overview of sessions and progress
- **Session History**: Track past and upcoming sessions
- **Profile Statistics**: Career development insights
- **Quick Actions**: Easy access to key features

#### **🌐 Community Features**
- **Find Recruiters**: Connect with industry professionals
- **Networking**: Build professional relationships
- **Career Resources**: Access to industry insights
- **Community Forum**: Peer-to-peer learning

### 🛡️ **For Administrators**

#### **📈 Analytics Dashboard**
- **Real-time Payments**: Live payment monitoring
- **User Statistics**: Comprehensive user analytics
- **Session Management**: Create and manage career sessions
- **Revenue Tracking**: Financial performance insights

#### **👥 User Management**
- **User Overview**: Complete user database
- **Payment Processing**: M-Pesa transaction management
- **Session Administration**: Full session lifecycle management
- **Email Management**: Automated communication system

#### **🔒 Security Features**
- **Rate Limiting**: API protection against abuse
- **CSRF Protection**: Cross-site request forgery prevention
- **Security Headers**: Comprehensive security implementation
- **Audit Logging**: Complete system activity tracking

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18.2.0**: Modern UI framework
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **React Router DOM**: Client-side routing
- **TanStack React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Lucide React**: Beautiful icons
- **Sonner**: Toast notifications
- **shadcn/ui**: Modern UI components

### **Backend**
- **Node.js 18.0.0**: JavaScript runtime
- **Express.js**: Web application framework
- **MySQL 8.0**: Relational database
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email service integration
- **express-rate-limit**: API rate limiting
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing

### **Security & Performance**
- **Password Validation**: Strong password requirements
- **Rate Limiting**: API abuse prevention
- **CSRF Protection**: Security token validation
- **Security Headers**: XSS, clickjacking protection
- **Database Indexing**: Optimized query performance
- **Error Handling**: Comprehensive error management

## 📱 **User Journey**

### **1. Registration & Onboarding**
```
Landing Page → Sign Up → Email Verification → Profile Setup → Dashboard
```

### **2. Session Discovery**
```
Dashboard → Browse Sessions → Session Details → Join Session → Payment
```

### **3. Payment Process**
```
M-Pesa Payment → Verification → Email Confirmation → Google Meet Access
```

### **4. Session Participation**
```
Email Notification → Google Meet Link → Live Session → Feedback & Networking
```

## 🗄️ **Database Schema**

### **Core Tables**
- **`users`**: User profiles and authentication
- **`sessions`**: Career session information
- **`payments`**: M-Pesa transaction records
- **`user_sessions`**: User-session relationships
- **`password_resets`**: Password recovery tokens

### **Key Relationships**
- Users can join multiple sessions
- Sessions have multiple participants
- Payments are linked to users and sessions
- Admins manage all system operations

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- npm or yarn package manager

### **Installation**

#### **1. Clone Repository**
```bash
git clone https://github.com/your-username/skillyme-app.git
cd skillyme-app
```

#### **2. Backend Setup**
```bash
cd backend
npm install
# Configure your .env file with database credentials
npm run dev
```

#### **3. Frontend Setup**
```bash
# Main application
npm install
npm run dev
```

## 🔒 **Security Features**

### **Authentication Security**
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API abuse prevention
- **CSRF Protection**: Cross-site request forgery prevention

### **Data Protection**
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS Enforcement**: Secure data transmission

### **System Security**
- **Security Headers**: Comprehensive HTTP security
- **Error Handling**: Secure error responses
- **Audit Logging**: Complete activity tracking
- **Database Security**: Encrypted sensitive data

## 📊 **Performance Features**

### **Frontend Optimization**
- **Code Splitting**: Optimized bundle sizes
- **Lazy Loading**: On-demand component loading
- **Caching**: React Query data caching
- **Responsive Design**: Mobile-first approach

### **Backend Optimization**
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: Resource usage optimization
- **Error Handling**: Graceful error management

## 🌐 **Deployment**

### **Production Deployment**
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: MySQL cloud hosting
- **Domain**: Custom domain configuration

### **Environment Setup**
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live application hosting

## 📈 **Analytics & Monitoring**

### **User Analytics**
- **Registration Tracking**: User acquisition metrics
- **Session Engagement**: Participation rates
- **Payment Analytics**: Revenue tracking
- **User Behavior**: Platform usage insights

### **System Monitoring**
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: System error monitoring
- **Security Monitoring**: Threat detection and prevention
- **Database Performance**: Query optimization

## 🤝 **Contributing**

### **Development Guidelines**
- **Code Style**: ESLint and Prettier configuration
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear code documentation
- **Security**: Security-first development approach

### **Pull Request Process**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 **Support & Contact**

### **Technical Support**
- **Email**: support@skillyme.com
- **Documentation**: [docs.skillyme.com](https://docs.skillyme.com)
- **Issues**: GitHub Issues tracker

### **Business Inquiries**
- **Email**: business@skillyme.com
- **Phone**: +254 XXX XXX XXX
- **Address**: Nairobi, Kenya

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **React Team**: For the amazing React framework
- **TailwindCSS**: For the utility-first CSS framework
- **MySQL Team**: For the robust database system
- **Open Source Community**: For the amazing tools and libraries

---

## 🚀 **Ready to Launch Your Career?**

Join thousands of students who are already building their careers with Skillyme. Connect with industry professionals, gain valuable insights, and accelerate your career development.

**[Get Started Now →](http://localhost:8081)**

---

**Built with ❤️ in Kenya for the world** 🌍