#!/bin/bash

# Skillyme Production Deployment Script
echo "🚀 Starting Skillyme Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Preparing for production deployment..."

# Step 1: Build main frontend
print_status "Building main frontend application..."
npm run build
if [ $? -eq 0 ]; then
    print_status "✅ Main frontend built successfully"
else
    print_error "❌ Main frontend build failed"
    exit 1
fi

# Step 2: Build admin dashboard
print_status "Building admin dashboard..."
cd Skillyme_Admin
npm run build
if [ $? -eq 0 ]; then
    print_status "✅ Admin dashboard built successfully"
else
    print_error "❌ Admin dashboard build failed"
    exit 1
fi
cd ..

# Step 3: Prepare backend
print_status "Preparing backend for production..."
cd backend
chmod +x build.sh
./build.sh
if [ $? -eq 0 ]; then
    print_status "✅ Backend prepared successfully"
else
    print_error "❌ Backend preparation failed"
    exit 1
fi
cd ..

print_status "🎉 All builds completed successfully!"
print_warning "Next steps:"
echo "1. Deploy backend to Render"
echo "2. Deploy main frontend to Vercel"
echo "3. Deploy admin dashboard to Vercel"
echo "4. Update environment variables with production URLs"
echo "5. Run database migrations on production database"
echo "6. Test all functionality"

print_status "📋 Deployment checklist:"
echo "- [ ] Backend deployed to Render"
echo "- [ ] Main frontend deployed to Vercel"
echo "- [ ] Admin dashboard deployed to Vercel"
echo "- [ ] Environment variables configured"
echo "- [ ] Database migrations run"
echo "- [ ] SSL certificates active"
echo "- [ ] CORS configured"
echo "- [ ] Email service configured"
echo "- [ ] Admin credentials set"
echo "- [ ] Test all user flows"
echo "- [ ] Test admin functionality"
echo "- [ ] Test payment processing"
echo "- [ ] Test email notifications"
