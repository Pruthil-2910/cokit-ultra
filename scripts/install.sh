# cokit-ultra Installer for macOS/Linux
# One command install for the ultimate token-saving stack

set -e

echo "🚀 Installing cokit-ultra..."
echo ""

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    echo "   Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed."
    echo "   Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create config directory
CONFIG_DIR="$HOME/.cokit-ultra"
mkdir -p "$CONFIG_DIR"

# Create default config
cat > "$CONFIG_DIR/config.json" << 'EOF'
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
EOF

echo "📝 Configuration created at $CONFIG_DIR/config.json"
echo ""

# Clone or update cokit-ultra
COKIT_DIR="$HOME/.cokit-ultra/installation"
if [ -d "$COKIT_DIR" ]; then
    echo "📦 Updating cokit-ultra..."
    cd "$COKIT_DIR"
    git pull
else
    echo "📦 Cloning cokit-ultra..."
    git clone https://github.com/YOUR-ORG/cokit-ultra.git "$COKIT_DIR"
    cd "$COKIT_DIR"
fi

# Ask for HF endpoint
echo ""
echo "🔧 FastContext Configuration"
echo "   (Leave empty to skip FastContext setup)"
read -p "Hugging Face Endpoint URL: " HF_ENDPOINT
read -p "Hugging Face Token: " HF_TOKEN

# Update .env file
cat > "$COKIT_DIR/.env" << EOF
HF_ENDPOINT_URL=$HF_ENDPOINT
HF_TOKEN=$HF_TOKEN
EOF

echo ""
echo "🐳 Building Docker containers..."
cd "$COKIT_DIR"
docker-compose build

echo ""
echo "🚀 Starting cokit-ultra services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ FastContext server is running"
else
    echo "⚠️  FastContext server may still be starting"
fi

# Configure Claude Code
echo ""
echo "🔌 Configuring Claude Code..."
CLAUDE_CONFIG="$HOME/.claude/settings.json"

if [ -f "$CLAUDE_CONFIG" ]; then
    # Backup existing config
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup"
    echo "✅ Backed up existing Claude config"
fi

# Add cokit-ultra MCP server
cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "cokit-ultra": {
      "command": "docker",
      "args": ["exec", "-i", "\$(docker ps -q -f name=mcp-server)", "node", "dist/server.js"]
    }
  }
}
EOF

echo "✅ Claude Code configured"

# Create shell aliases
echo ""
echo "📝 Adding shell aliases..."
if [ -f "$HOME/.bashrc" ]; then
    cat >> "$HOME/.bashrc" << 'EOF'

# cokit-ultra aliases
alias cokit-status='docker exec -i $(docker ps -q -f name=mcp-server) node dist/server.js --status'
alias cokit-logs='docker logs -f cokit-ultra-mcp-server-1'
alias cokit-restart='cd ~/.cokit-ultra/installation && docker-compose restart'
EOF
    echo "✅ Added to .bashrc"
fi

if [ -f "$HOME/.zshrc" ]; then
    cat >> "$HOME/.zshrc" << 'EOF'

# cokit-ultra aliases
alias cokit-status='docker exec -i $(docker ps -q -f name=mcp-server) node dist/server.js --status'
alias cokit-logs='docker logs -f cokit-ultra-mcp-server-1'
alias cokit-restart='cd ~/.cokit-ultra/installation && docker-compose restart'
EOF
    echo "✅ Added to .zshrc"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COKIT-ULTRA IS READY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Try: /cokit-status"
echo "  3. Toggle plugins: /cokit-toggle caveman on"
echo "  4. Set mode: /cokit-mode full"
echo ""
echo "  Useful commands:"
echo "  - cokit-status    : Check service status"
echo "  - cokit-logs      : View logs"
echo "  - cokit-restart   : Restart services"
echo ""
echo "  Status dashboard: http://localhost:8080"
echo "  FastContext API:  http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""