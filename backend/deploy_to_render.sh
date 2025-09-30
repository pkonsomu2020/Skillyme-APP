#!/bin/bash

# Deploy Skillyme Backend to Render
echo "🚀 Deploying Skillyme Backend to Render..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in the backend directory
if [ ! -f "server.js" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

print_status "Preparing backend for Render deployment..."

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

print_status "✅ Backend prepared for Render deployment!"
print_warning "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a PostgreSQL database on Render"
echo "3. Create a Web Service on Render"
echo "4. Set environment variables in Render dashboard"
echo "5. Run database setup: node database_migrations/setup_render_database.js"

print_status "📋 Render Deployment Checklist:"
echo "- [ ] GitHub repository connected"
echo "- [ ] PostgreSQL database created on Render"
echo "- [ ] Web service created on Render"
echo "- [ ] Environment variables configured"
echo "- [ ] Database setup script run"
echo "- [ ] Service deployed and running"
echo "- [ ] Health check passing (/api/test)"
echo "- [ ] CORS configured for frontend URLs"
echo "- [ ] Email service configured"
echo "- [ ] Admin credentials working"

print_status "🎯 Ready for Render deployment!"
