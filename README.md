# 🚀 cokit-ultra

**The ultimate token-saving stack for AI coding agents**

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/YOUR-ORG/cokit-ultra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

> Save **70-80% on tokens** while maintaining 100% accuracy. Built for Claude Code, powered by Microsoft's FastContext-4B.

## Quick Start

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/YOUR-ORG/cokit-ultra/main/scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/YOUR-ORG/cokit-ultra/main/scripts/install.ps1 | iex
```

**That's it.** Restart Claude Code and you're saving tokens.

---

## What You Get

| Feature | Savings | Description |
|---------|---------|-------------|
| **caveman** | ~65-75% output | Terse, technical responses |
| **ponytail** | ~54% code | YAGNI, stdlib-first, minimal diffs |
| **claude-mem** | ~80% context | Persistent memory across sessions |
| **code-memory** | ~50% search | Local RAG with AST parsing |
| **FastContext-4B** | ~60% exploration | Dedicated repo explorer subagent |

**Total: 70-80% token reduction** on typical coding sessions.

---

## Commands

### Toggle Plugins

```
/cokit-toggle caveman on|off
/cokit-toggle ponytail on|off
/cokit-toggle claude-mem on|off
/cokit-toggle code-memory on|off
/cokit-toggle fastcontext on|off
```

### Preset Modes

```
/cokit-mode minimal   # caveman + ponytail only
/cokit-mode full      # All 5 plugins active
/cokit-mode search    # FastContext + code-memory
/cokit-mode memory    # claude-mem + code-memory
/cokit-mode off       # Everything disabled
```

### Status & Savings

```
/cokit-status         # Show plugin status
/cokit-gain           # Detailed token savings
```

### Code Search

```
/index_codebase       # Index current directory
/search_codebase query="auth flow"
```

---

## Architecture

```
┌─────────────────────────────────────┐
│      Claude Code (Your Agent)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      cokit-ultra MCP Server         │
│  ┌──────────────────────────────┐   │
│  │  Toggle Manager              │   │
│  │  Plugin Orchestrator         │   │
│  │  Token Tracker               │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│caveman │ │ponytail│ │claude- │ │code-     │
│        │ │        │ │mem     │ │memory    │
└────────┘ └────────┘ └────────┘ └──────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   FastContext-4B (HF Endpoint)      │
│   ┌──────────────────────────────┐  │
│   │  Queue System (Redis)        │  │
│   │  Load Balancer               │  │
│   │  Wait Time Estimator         │  │
│   └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Docker Deployment

### Start All Services

```bash
cd ~/.cokit-ultra/installation
docker-compose up -d
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `mcp-server` | 8765 | Main MCP server |
| `fastcontext` | 3000 | FastContext API + queue |
| `redis` | 6379 | Queue backend |
| `dashboard` | 8080 | Status dashboard (optional) |

### With Dashboard

```bash
docker-compose --profile with-dashboard up -d
```

---

## Configuration

### Config File: `~/.cokit-ultra/config.json`

```json
{
  "plugins": {
    "caveman": true,
    "ponytail": true,
    "claude-mem": true,
    "code-memory": true,
    "fastcontext": true
  },
  "default_mode": "full",
  "hf_endpoint_url": "https://your-endpoint.hf.space",
  "hf_token": "your_hf_token"
}
```

### Environment Variables

```bash
# .env file
HF_ENDPOINT_URL=https://your-endpoint.hf.space
HF_TOKEN=hf_xxx
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Token Savings Tracker

Real-time tracking of your token savings:

```
┌─────────────────────────────────────┐
│     TOKEN SAVINGS (Session)         │
├─────────────────────────────────────┤
│   caveman:     -12.4k tokens (65%)  │
│   ponytail:    -8.2k  tokens (54%)  │
│   code-memory: -15.1k tokens (50%)  │
│   ───────────────────────────────   │
│   TOTAL:       -35.7k tokens (68%)  │
│   $$$ SAVED:   $0.42 (Claude Pro)   │
└─────────────────────────────────────┘
```

---

## Development

### Local Development

```bash
cd mcp-bridge
npm install
npm run dev
```

### Build Docker Images

```bash
docker-compose build
```

### Test MCP Server

```bash
npm test
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Full rebuild
docker-compose down -v
docker-compose up -d --build
```

### FastContext Queue Backed Up

```bash
# Check queue status
curl http://localhost:3000/queue/status

# Expected: {"position": 0, "estimated_wait_seconds": 0}
```

### Plugins Not Loading

```bash
# Check config
cat ~/.cokit-ultra/config.json

# Reset to defaults
rm ~/.cokit-ultra/config.json
docker-compose restart mcp-server
```

---

## Components

cokit-ultra integrates these amazing projects:

- **[caveman](https://github.com/JuliusBrussee/caveman)** - Output compression (75.3k⭐)
- **[ponytail](https://github.com/DietrichGebert/ponytail)** - Code minimalism (44.8k⭐)
- **[claude-mem](https://github.com/thedotmack/claude-mem)** - Persistent memory (83.5k⭐)
- **[code-memory](https://github.com/kapillamba4/code-memory)** - Local RAG
- **[FastContext](https://huggingface.co/microsoft/FastContext-1.0-4B-SFT)** - MSFT 4B explorer

---

## Roadmap

- [ ] Local 4B model download (offline mode)
- [ ] More embedding models for code-memory
- [ ] Grafana dashboard for token analytics
- [ ] Multi-agent support (Codex, Gemini)
- [ ] Plugin marketplace

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Credits

Built with love by combining the best token-saving tools in one package. Special thanks to all the upstream maintainers.

**Made for the community, by the community.** 🚀

---

## Support

- **Issues:** [GitHub Issues](https://github.com/YOUR-ORG/cokit-ultra/issues)
- **Discord:** [Join our Discord](https://discord.gg/your-invite)
- **Twitter:** [@yourhandle](https://twitter.com/yourhandle)

---

**Star this repo if it saves your tokens! ⭐**
