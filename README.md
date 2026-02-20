# Persona

AI Coding CLI Provider Manager

## Supported CLI Tools

| CLI | Description |
|-----|-------------|
| Claude | Anthropic's Claude CLI |
| Codex | OpenAI's Codex CLI |

## Interface

![Interface](docs/screenshot.png)

[中文文档](README.zh-CN.md) | [English Documentation](README.md) 

## Installation

### Quick Install

```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash
```

For custom installation directory:
```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash -s -- -d /usr/local/bin
```

### Manual Download
### Supported Platforms

| Platform | Architecture | File |
|----------|-------------|------|
| macOS | ARM64 (Apple Silicon) | `persona-{version}-bun-darwin-arm64` |
| macOS | x64 (Intel) | `persona-{version}-bun-darwin-x64` |
| Linux | x64 | `persona-{version}-bun-linux-x64` |
| Linux | ARM64 | `persona-{version}-bun-linux-arm64` |
| Windows | x64 | `persona-{version}-bun-windows-x64.exe` |

Download the appropriate binary for your system, make it executable (Linux/macOS), and add it to your PATH.

## Usage

### Interactive Mode

Launch the interactive TUI:

```bash
persona
```

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate provider list |
| Tab | Switch between Claude/Codex mode |
| Enter | Switch to selected provider |
| a | Add new provider |
| e | Edit selected provider |
| d | Delete selected provider |
| p | Test ping selected provider |
| t | Change theme |
| q | Quit |

### Command Line Mode

#### List Providers

```bash
persona ls                    # List Claude providers (default)
persona ls --target claude    # List Claude providers
persona ls --target codex     # List Codex providers
```

#### Add Provider

```bash
persona add                   # Add Claude provider (default)
persona add --target codex    # Add Codex provider
```

#### Switch Provider

```bash
persona use <provider-id>                   # Switch Claude provider (default)
persona use --target claude <provider-id>   # Switch Claude provider
persona use --target codex <provider-id>    # Switch Codex provider
```

#### Test Provider

```bash
persona ping <provider-id>
```

#### Remove Provider

```bash
persona rm <provider-id>
```

#### Show Current Status

```bash
persona status        # Shows both Claude and Codex provider status
```

#### Theme Management

```bash
persona theme              # Show current theme
persona theme list         # List available themes
persona theme <name>       # Switch to a theme (persona, gruvbox, dracula, nord)
```

#### Environment Variables Override

```bash
persona env                # Show environment variable overrides
persona env edit          # Edit environment variable overrides
```

#### Provider Templates

```bash
persona templates         # List available provider templates
persona templates codex  # List Codex-specific templates
```

#### Sync Templates and Themes

```bash
persona sync                    # Sync all templates and themes from GitHub
persona sync --templates         # Sync only templates
persona sync --themes           # Sync only themes
persona sync --force            # Force overwrite existing files
```

> Note: After installation, run `persona sync` to download the latest templates and themes to `~/.persona/`

## Supported CLI Targets

Persona supports managing providers for multiple AI CLI tools:

| Target | Description |
|--------|-------------|
| Claude | Anthropic's Claude CLI (default) |
| Codex | OpenAI's Codex CLI |

### Codex Configuration

When adding a Codex provider, you'll be prompted for:

- **Wire API**: Choose between `responses`, `completions`, or `chat`
- **OpenAI Auth**: Whether the provider requires OpenAI authentication

Example Codex providers:

- Ollama (local)
- OpenAI compatible APIs (DeepSeek, etc.)

After switching to a Codex provider, run:

```bash
codex --profile persona
```

This uses the `persona` profile configured by Persona.

## Configuration Files

- **Provider Config:** `~/.persona/config.json`
- **General Config:** `~/.persona/general.json`

## Themes

![Themes](docs/screenshot2.png)

Persona supports multiple color themes. Available themes:

| Theme | Description |
|-------|-------------|
| persona | Default dark theme |
| gruvbox | Vintage/gruvbox color scheme |
| dracula | Popular purple dark theme |
| nord | Arctic, north-bluish color palette |

## License

MIT
