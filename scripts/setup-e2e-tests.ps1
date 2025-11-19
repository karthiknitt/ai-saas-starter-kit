# E2E Test Setup Script (PowerShell)
# This script sets up the environment and runs e2e tests

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up E2E testing environment..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Start database containers
Write-Host ""
Write-Host "📦 Starting PostgreSQL database..." -ForegroundColor Cyan
pnpm docker:up

# Wait for PostgreSQL to be ready
Write-Host ""
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if database is accessible
$maxRetries = 30
$retryCount = 0
$isReady = $false

while (-not $isReady -and $retryCount -lt $maxRetries) {
    $retryCount++
    try {
        docker exec ai-saas-postgres pg_isready -U postgres | Out-Null
        $isReady = $true
    } catch {
        Write-Host "Waiting for PostgreSQL... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "❌ Error: PostgreSQL failed to start after $maxRetries attempts" -ForegroundColor Red
    exit 1
}

Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green

# Push database schema
Write-Host ""
Write-Host "📋 Pushing database schema..." -ForegroundColor Cyan
pnpm db:push

# Seed database (optional, but good for testing)
Write-Host ""
Write-Host "🌱 Seeding database with test data..." -ForegroundColor Cyan
try {
    pnpm db:seed
} catch {
    Write-Host "⚠️  Warning: Database seeding failed, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 You can now run tests with:" -ForegroundColor Cyan
Write-Host "   pnpm test:e2e              # Run all tests"
Write-Host "   pnpm test:e2e:ui           # Run with UI"
Write-Host "   pnpm test:e2e:headed       # Run in headed mode"
Write-Host "   pnpm test:e2e:debug        # Run in debug mode"
Write-Host ""
Write-Host "🧹 To clean up after testing:" -ForegroundColor Cyan
Write-Host "   pnpm docker:down           # Stop containers"
Write-Host "   pnpm docker:reset          # Reset database completely"
Write-Host ""

# Ask if user wants to run tests now
$response = Read-Host "Would you like to run the e2e tests now? (y/n)"
if ($response -match "^[Yy]$") {
    Write-Host ""
    Write-Host "🧪 Running e2e tests..." -ForegroundColor Cyan
    pnpm test:e2e
}
