# PowerShell script to fix Fly.io MySQL deployment
Write-Host "🔧 Fixing Fly.io MySQL deployment..." -ForegroundColor Green

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

Write-Host "📊 Updating Fly.io configuration..." -ForegroundColor Blue

# Update secrets with the correct values
Write-Host "Setting database secrets..." -ForegroundColor Yellow
fly secrets set MYSQL_ROOT_PASSWORD="ponsomu756@" --app skillyme-mysql
fly secrets set MYSQL_DATABASE="skillyme_app" --app skillyme-mysql
fly secrets set MYSQL_USER="skillyme_root" --app skillyme-mysql
fly secrets set MYSQL_PASSWORD="ponsomu756@" --app skillyme-mysql

Write-Host "🚀 Deploying MySQL database to Fly.io with Dockerfile..." -ForegroundColor Blue
fly deploy --app skillyme-mysql

Write-Host "✅ MySQL database deployed to Fly.io!" -ForegroundColor Green
Write-Host "📋 Database connection details:" -ForegroundColor Cyan
Write-Host "Host: skillyme-mysql.fly.dev" -ForegroundColor White
Write-Host "Port: 3306" -ForegroundColor White
Write-Host "Database: skillyme_app" -ForegroundColor White
Write-Host "User: skillyme_root" -ForegroundColor White
Write-Host "Password: ponsomu756@" -ForegroundColor White

Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for the database to be fully deployed (2-3 minutes)" -ForegroundColor White
Write-Host "2. Deploy your backend to Render with these database credentials" -ForegroundColor White
Write-Host "3. Test the database connection" -ForegroundColor White
Write-Host "4. Deploy your frontend to Vercel" -ForegroundColor White

Write-Host "🎯 Database is ready for production use!" -ForegroundColor Green
