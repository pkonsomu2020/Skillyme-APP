# PowerShell script to setup Fly.io MySQL database for Skillyme
Write-Host "🚀 Setting up Fly.io MySQL Database for Skillyme..." -ForegroundColor Green

# Check if Fly.io CLI is installed
try {
    fly --version | Out-Null
    Write-Host "✅ Fly.io CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly.io CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "Run: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Fly.io
try {
    fly auth whoami | Out-Null
    Write-Host "✅ Logged in to Fly.io" -ForegroundColor Green
} catch {
    Write-Host "❌ Please login to Fly.io first:" -ForegroundColor Red
    Write-Host "Run: fly auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Creating MySQL database on Fly.io..." -ForegroundColor Blue

# Create Fly.io app
Write-Host "Creating Fly.io app..." -ForegroundColor Yellow
fly apps create skillyme-mysql --yes

# Set secrets
Write-Host "Setting database secrets..." -ForegroundColor Yellow
fly secrets set MYSQL_ROOT_PASSWORD="SkillymeRoot2025!" --app skillyme-mysql
fly secrets set MYSQL_DATABASE="skillyme_production" --app skillyme-mysql
fly secrets set MYSQL_USER="skillyme_user" --app skillyme-mysql
fly secrets set MYSQL_PASSWORD="SkillymeUser2025!" --app skillyme-mysql

Write-Host "🚀 Deploying MySQL database to Fly.io..." -ForegroundColor Blue
fly deploy --app skillyme-mysql

Write-Host "✅ MySQL database deployed to Fly.io!" -ForegroundColor Green
Write-Host "📋 Database connection details:" -ForegroundColor Cyan
Write-Host "Host: skillyme-mysql.fly.dev" -ForegroundColor White
Write-Host "Port: 3306" -ForegroundColor White
Write-Host "Database: skillyme_production" -ForegroundColor White
Write-Host "User: skillyme_user" -ForegroundColor White
Write-Host "Password: SkillymeUser2025!" -ForegroundColor White

Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy your backend to Render with these database credentials" -ForegroundColor White
Write-Host "2. Run the database setup script to create tables" -ForegroundColor White
Write-Host "3. Deploy your frontend to Vercel" -ForegroundColor White
Write-Host "4. Test the complete application" -ForegroundColor White

Write-Host "🎯 Database is ready for production use!" -ForegroundColor Green
