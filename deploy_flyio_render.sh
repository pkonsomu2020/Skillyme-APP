#!/bin/bash

# Deploy Skillyme: Fly.io MySQL + Render Backend
echo "🚀 Deploying Skillyme: Fly.io MySQL + Render Backend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_step "Step 1: Setting up Fly.io MySQL Database..."

# Check if Fly.io CLI is installed
if ! command -v fly &> /dev/null; then
    print_error "Fly.io CLI is not installed. Please install it first:"
    echo "Windows: iwr https://fly.io/install.ps1 -useb | iex"
    echo "macOS/Linux: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in to Fly.io
if ! fly auth whoami &> /dev/null; then
    print_warning "Please login to Fly.io first:"
    echo "fly auth login"
    exit 1
fi

print_status "Creating MySQL database on Fly.io..."

# Create Fly.io app
fly apps create skillyme-mysql --yes

# Set secrets
fly secrets set MYSQL_ROOT_PASSWORD="SkillymeRoot2025!" --app skillyme-mysql
fly secrets set MYSQL_DATABASE="skillyme_production" --app skillyme-mysql
fly secrets set MYSQL_USER="skillyme_user" --app skillyme-mysql
fly secrets set MYSQL_PASSWORD="SkillymeUser2025!" --app skillyme-mysql

print_status "Deploying MySQL database to Fly.io..."
fly deploy --app skillyme-mysql

print_status "✅ MySQL database deployed to Fly.io!"
print_status "Database URL: skillyme-mysql.fly.dev:3306"

print_step "Step 2: Preparing Backend for Render..."

# Prepare backend
cd backend

# Install production dependencies
print_status "Installing production dependencies..."
npm install --production

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p uploads

# Set permissions
print_status "Setting permissions..."
chmod 755 server.js
chmod 755 database_migrations/*.js

cd ..

print_status "✅ Backend prepared for Render deployment!"

print_step "Step 3: Database Setup Instructions"

print_warning "Next steps to complete the setup:"
echo ""
echo "1. 🗄️  DATABASE SETUP:"
echo "   - Your MySQL database is running on Fly.io"
echo "   - Host: skillyme-mysql.fly.dev"
echo "   - Port: 3306"
echo "   - Database: skillyme_production"
echo "   - User: skillyme_user"
echo "   - Password: SkillymeUser2025!"
echo ""
echo "2. 🚀 RENDER BACKEND DEPLOYMENT:"
echo "   - Go to https://render.com"
echo "   - Create a new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set root directory to 'backend'"
echo "   - Set environment variables:"
echo ""
echo "   DB_HOST=skillyme-mysql.fly.dev"
echo "   DB_USER=skillyme_user"
echo "   DB_PASSWORD=SkillymeUser2025!"
echo "   DB_NAME=skillyme_production"
echo "   DB_PORT=3306"
echo "   JWT_SECRET=your-super-secure-jwt-secret"
echo "   EMAIL_HOST=smtp.gmail.com"
echo "   EMAIL_PORT=587"
echo "   EMAIL_USER=your-email@gmail.com"
echo "   EMAIL_PASS=your-gmail-app-password"
echo "   EMAIL_FROM=your-email@gmail.com"
echo "   FRONTEND_URL=https://your-frontend-domain.vercel.app"
echo "   ADMIN_URL=https://your-admin-domain.vercel.app"
echo "   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-admin-domain.vercel.app"
echo "   PORT=10000"
echo "   NODE_ENV=production"
echo "   BCRYPT_ROUNDS=12"
echo ""
echo "3. 🗃️  DATABASE TABLES SETUP:"
echo "   - After Render deployment, use Render Shell to run:"
echo "   node database_migrations/setup_flyio_database.js"
echo ""
echo "4. 🌐 FRONTEND DEPLOYMENT:"
echo "   - Deploy main app to Vercel with VITE_API_URL=https://your-backend.onrender.com/api"
echo "   - Deploy admin dashboard to Vercel with VITE_API_URL=https://your-backend.onrender.com/api"
echo ""

print_status "📋 Deployment Checklist:"
echo "- [ ] Fly.io MySQL database created and running"
echo "- [ ] Render backend deployed and running"
echo "- [ ] Database tables created"
echo "- [ ] Admin user created (admin/Skillyme@2025)"
echo "- [ ] Sample session created"
echo "- [ ] Health check passing"
echo "- [ ] CORS configured"
echo "- [ ] Email service configured"
echo "- [ ] Frontend deployed to Vercel"
echo "- [ ] All URLs updated"
echo "- [ ] Complete flow tested"

print_status "🎯 Ready for production deployment!"
print_status "📖 Follow the detailed guide in FLYIO_MYSQL_SETUP.md"
