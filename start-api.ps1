# ============================================================
# UniYO API Local Startup Script
# ============================================================
Write-Host "🔧 Loading environment variables from server/.env..." -ForegroundColor Cyan

$envFile = "C:\Users\ASUS\.gemini\antigravity\scratch\uniyo\server\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ server/.env not found!" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$") {
        $key = $matches[1]
        $val = $matches[2].Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

# Local PostgreSQL connection (overrides)
$env:DATABASE_URL = "Host=localhost;Database=uniyo_db;Username=postgres;Password=1234"

# Force Development env so we see full logs
$env:ASPNETCORE_ENVIRONMENT = "Development"

# ============================================================
# Verification
# ============================================================
Write-Host ""
Write-Host "✅ Environment loaded:" -ForegroundColor Green
Write-Host "   GROQ_API_KEY    length=$($env:GROQ_API_KEY.Length)"
Write-Host "   GROQ_MODEL      $($env:GROQ_MODEL)"
Write-Host "   DATABASE_URL    $($env:DATABASE_URL)"
Write-Host ""

if ($env:GROQ_API_KEY.Length -lt 40) {
    Write-Host "⚠️  WARNING: GROQ_API_KEY looks invalid (length < 40)." -ForegroundColor Yellow
    Write-Host "   Expected: ~56 characters starting with gsk_" -ForegroundColor Yellow
}

# ============================================================
# Start the API
# ============================================================
Write-Host "🚀 Starting UniYO API..." -ForegroundColor Cyan
Set-Location "C:\Users\ASUS\.gemini\antigravity\scratch\uniyo\UniYo.Api"
dotnet run
