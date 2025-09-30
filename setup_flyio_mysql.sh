#!/bin/bash

# Quick setup script for Fly.io MySQL database
echo "🚀 Setting up Fly.io MySQL Database for Skillyme..."

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
print_status "Setting database secrets..."
fly secrets set MYSQL_ROOT_PASSWORD="SkillymeRoot2025!" --app skillyme-mysql
fly secrets set MYSQL_DATABASE="skillyme_production" --app skillyme-mysql
fly secrets set MYSQL_USER="skillyme_user" --app skillyme-mysql
fly secrets set MYSQL_PASSWORD="SkillymeUser2025!" --app skillyme-mysql

print_status "Deploying MySQL database to Fly.io..."
fly deploy --app skillyme-mysql

print_status "✅ MySQL database deployed to Fly.io!"
print_status "Database connection details:"
echo "Host: skillyme-mysql.fly.dev"
echo "Port: 3306"
echo "Database: skillyme_production"
echo "User: skillyme_user"
echo "Password: SkillymeUser2025!"

print_warning "Next steps:"
echo "1. Deploy your backend to Render with these database credentials"
echo "2. Run the database setup script to create tables"
echo "3. Deploy your frontend to Vercel"
echo "4. Test the complete application"

print_status "🎯 Database is ready for production use!"
