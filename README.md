# Persona

AI Coding CLI Provider Manager

## Interface

![Interface](docs/screenshot.png)

[中文文档](README.zh-CN.md) | [English Documentation](README.md) 

## Installation

Download the latest release from the [GitHub Releases](https://github.com/puterjam/persona/releases) page.

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
| c | Edit general config |
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

#### Edit Config

```bash
persona config
```

## Configuration Files

- **Provider Config:** `~/.persona/config.json`
- **General Config:** `~/.persona/general.json`

## License

MIT
