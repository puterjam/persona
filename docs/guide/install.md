# Installation

## Quick Install

```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash
```

For custom installation directory:

```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash -s -- -d /usr/local/bin
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --force` | Force reinstall | `false` |
| `-d, --dir` | Installation directory | `~/.local/bin` |
| `version` | Specific version to install | `latest` |

## Manual Download

Download the appropriate binary for your platform:

| Platform | Architecture | File |
|----------|-------------|------|
| macOS | ARM64 (Apple Silicon) | `persona-{version}-bun-darwin-arm64` |
| macOS | x64 (Intel) | `persona-{version}-bun-darwin-x64` |
| Linux | x64 | `persona-{version}-bun-linux-x64` |
| Linux | ARM64 | `persona-{version}-bun-linux-arm64` |
| Windows | x64 | `persona-{version}-bun-windows-x64.exe` |

Download from [GitHub Releases](https://github.com/puterjam/persona/releases)

## Post Installation

After installation, sync the latest templates and themes:

```bash
persona sync
```

This will download:
- **Templates**: Provider configurations for various AI services
- **Themes**: Additional color themes

## Build from Source

```bash
# Clone the repository
git clone https://github.com/puterjam/persona.git
cd persona

# Install dependencies
pnpm install

# Build
pnpm run build

# Or run in development mode
pnpm run dev
```

## Configuration Files

- **Provider Config**: `~/.persona/config.json`
- **General Config**: `~/.persona/general.json`
- **Templates**: `~/.persona/templates/`
- **Themes**: `~/.persona/themes/`
