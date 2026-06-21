# cokit-ultra Installer for Windows (PowerShell)
# One command install for the ultimate token-saving stack

$ErrorActionPreference = "Stop"

Write-Host "🚀 Installing cokit-ultra..." -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "❌ Docker is required but not installed." -ForegroundColor Red
    Write-Host "   Install Docker Desktop: https://docs.docker.com/desktop/"
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Create config directory
$ConfigDir = "$env:APPDATA\cokit-ultra"
if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir | Out-Null
}

# Create default config
$ConfigPath = Join-Path $ConfigDir "config.json"
@'
{
  "plugins": {
    "caveman": true,
    "ponytail": true,
    "claude-mem": true,
    "code-memory": true,
    "fastcontext": true
  },
  "default_mode": "full",
  "hf_endpoint_url": "",
  "hf_token": ""
}
'@ | Set-Content -Path $ConfigPath -Encoding UTF8

Write-Host "📝 Configuration created at $ConfigPath" -ForegroundColor Green
Write-Host ""

# Clone or update cokit-ultra
$InstallDir = "$env:USERPROFILE\.cokit-ultra\installation"
if (Test-Path $InstallDir) {
    Write-Host "📦 Updating cokit-ultra..." -ForegroundColor Cyan
    Set-Location $InstallDir
    git pull
} else {
    Write-Host "📦 Cloning cokit-ultra..." -ForegroundColor Cyan
    git clone https://github.com/YOUR-ORG/cokit-ultra.git $InstallDir
    Set-Location $InstallDir
}

# Ask for HF endpoint
Write-Host ""
Write-Host "🔧 FastContext Configuration" -ForegroundColor Cyan
Write-Host "   (Leave empty to skip FastContext setup)"
$HF_ENDPOINT = Read-Host "Hugging Face Endpoint URL"
$HF_TOKEN = Read-Host "Hugging Face Token"

# Update .env file
@"
HF_ENDPOINT_URL=$HF_ENDPOINT
HF_TOKEN=$HF_TOKEN
"@ | Set-Content -Path ".env" -Encoding UTF8

Write-Host ""
Write-Host "🐳 Building Docker containers..." -ForegroundColor Cyan
docker-compose build

Write-Host ""
Write-Host "🚀 Starting cokit-ultra services..." -ForegroundColor Cyan
docker-compose up -d

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ FastContext server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  FastContext server may still be starting" -ForegroundColor Yellow
}

# Configure Claude Code
Write-Host ""
Write-Host "🔌 Configuring Claude Code..." -ForegroundColor Cyan
$ClaudeConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"

if (Test-Path $ClaudeConfigPath) {
    # Backup existing config
    Copy-Item $ClaudeConfigPath "$ClaudeConfigPath.backup"
    Write-Host "✅ Backed up existing Claude config" -ForegroundColor Green
}

# Add cokit-ultra MCP server
@'
{
  "mcpServers": {
    "cokit-ultra": {
      "command": "docker",
      "args": ["exec", "-i", "$(docker ps -q -f name=mcp-server)", "node", "dist/server.js"]
    }
  }
}
'@ | Set-Content -Path $ClaudeConfigPath -Encoding UTF8

Write-Host "✅ Claude Code configured" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  COKIT-ULTRA IS READY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "  1. Restart Claude Code"
Write-Host "  2. Try: /cokit-status"
Write-Host "  3. Toggle plugins: /cokit-toggle caveman on"
Write-Host "  4. Set mode: /cokit-mode full"
Write-Host ""
Write-Host "  Useful commands:"
Write-Host "  - cokit-status    : Check service status"
Write-Host "  - cokit-logs      : View logs"
Write-Host "  - cokit-restart   : Restart services"
Write-Host ""
Write-Host "  Status dashboard: http://localhost:8080"
Write-Host "  FastContext API:  http://localhost:3000"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""