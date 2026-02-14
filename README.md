# Persona

A CLI tool to switch Claude CLI configurations between different model providers.

## Features

- Support for 20+ model providers
- Interactive CLI with guided setup
- TUI keyboard interaction mode
- API connection testing with auto-endpoint detection
- Configuration stored in `~/.persona/`
- Claude settings written to `~/.claude/settings.json`

## Installation

```bash
git clone https://github.com/puterjam/persona.git
cd persona
npm install
npm run build
sudo npm link
```

## Usage

```bash
# List all configured providers
persona list

# Switch provider (interactive mode)
persona switch

# Switch to a specific provider
persona switch <provider-id>

# Reset to default (Anthropic official)
persona switch --reset

# Add a new provider (interactive)
persona add

# Add a provider using template
persona add --template claude/minimax --api-key YOUR_API_KEY

# Edit a provider
persona edit <provider-id>

# Delete a provider
persona delete <provider-id>

# Test API connection
persona test [provider-id]

# Show current status
persona status

# List available templates
persona templates

# Start interactive TUI mode
persona interactive

# Show help
persona help
```

## Available Templates

### China Official
- DeepSeek
- Zhipu GLM
- Aliyun Bailian
- Kimi / Kimi for Coding
- MiniMax
- Doubao Seed
- Xiaomi MiMo

### Aggregator
- ModelScope
- SiliconFlow
- OpenRouter
- Nvidia NIM

### International
- Claude Official
- OpenAI
- Ollama (Local)
- Cloudflare Workers AI
- Groq

## Configuration

- User config: `~/.persona/config.json`
- Claude settings: `~/.claude/settings.json`

## License

MIT
