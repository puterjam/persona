# Persona

AI Coding CLI Provider Manager

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
persona ls
```

#### Add Provider

```bash
persona add
```

#### Switch Provider

```bash
persona use <provider-id>
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
persona status
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
```

#### Sync Templates and Themes

```bash
persona sync                    # Sync all templates and themes from GitHub
persona sync --templates         # Sync only templates
persona sync --themes           # Sync only themes
persona sync --force            # Force overwrite existing files
```

> Note: After installation, run `persona sync` to download the latest templates and themes to `~/.persona/`

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
