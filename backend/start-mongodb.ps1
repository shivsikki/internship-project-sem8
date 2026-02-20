# MongoDB Startup Script
# Run this script as Administrator, or run mongod manually

Write-Host "Starting MongoDB..." -ForegroundColor Green

$mongodPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
$dbPath = Join-Path $PSScriptRoot "data\db"

# Create data directory if it doesn't exist
if (-not (Test-Path $dbPath)) {
    New-Item -ItemType Directory -Force -Path $dbPath | Out-Null
    Write-Host "Created data directory: $dbPath" -ForegroundColor Yellow
}

# Check if MongoDB is already running
$mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "MongoDB is already running (PID: $($mongoProcess.Id))" -ForegroundColor Yellow
    exit 0
}

# Try to start MongoDB service first (requires admin)
try {
    Start-Service MongoDB -ErrorAction Stop
    Write-Host "✅ MongoDB service started successfully!" -ForegroundColor Green
    Start-Sleep -Seconds 2
    $service = Get-Service MongoDB
    if ($service.Status -eq 'Running') {
        Write-Host "MongoDB is now running on port 27017" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "Could not start MongoDB service (requires admin privileges)" -ForegroundColor Yellow
    Write-Host "Starting mongod.exe directly..." -ForegroundColor Yellow
    
    # Start mongod directly
    if (Test-Path $mongodPath) {
        Start-Process -FilePath $mongodPath -ArgumentList "--dbpath", "`"$dbPath`"" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "✅ MongoDB started directly!" -ForegroundColor Green
        Write-Host "Data directory: $dbPath" -ForegroundColor Cyan
    } else {
        Write-Host "❌ MongoDB executable not found at: $mongodPath" -ForegroundColor Red
        Write-Host "Please install MongoDB or update the path in this script." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "MongoDB should now be running. Check with: Get-Process mongod" -ForegroundColor Cyan
