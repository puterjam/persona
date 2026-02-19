# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Persona** is a CLI tool to switch Claude CLI configurations between different model providers. It allows users to configure and switch between 20+ AI model providers (DeepSeek, Zhipu GLM, Kimi, MiniMax, OpenAI, Ollama, etc.).

## Commands

```bash
pnpm install    # Install dependencies
bun run build   # Compile TypeScript to single executable (dist/persona)
bun run dev     # Run in development mode without building
bun run link    # Build, compile, and globally link (for CLI usage, requires sudo)
```

### CLI Commands
```bash
persona              # Start interactive TUI (default)
persona ls           # List all configured providers
persona use <id>     # Switch to provider by ID
persona add          # Add new provider (interactive or with flags)
persona edit <id>    # Edit existing provider
persona rm <id>      # Delete provider
persona ping [id]    # Test provider API (current or specified)
persona status       # Show current active provider and config
persona templates    # List available provider templates
persona theme [name] # Manage themes (list, show, or set)
persona env [edit]   # Manage environment variable overrides
```

## Architecture

### File Structure
- `src/index.ts` - Entry point, CLI command routing with parseArgs for flags
- `src/commands/` - Command implementations (add, switch, list, delete, edit, test, config, theme, env)
  - Each command supports both interactive (inquirer prompts) and flag-based modes
- `src/config/store.ts` - Configuration management (singleton ConfigStore class)
- `src/config/templates.ts` - Provider template loading from `templates/` directory
- `src/types/index.ts` - TypeScript interfaces
- `src/tui/` - **New React-based TUI using OpenTUI** (preferred for new development)
  - `components/App.tsx` - Main TUI application
  - `components/dialogs/` - Dialog components (Confirm, Input, List)
  - `components/` - Header, DetailPanel, StatusBar components
- `src/utils/tui.ts` - **Legacy blessed-based TUI** (being phased out)
- `src/utils/api.ts` - API testing with timing breakdown (DNS, CONNECT, TTFB, API)
- `src/utils/theme.ts` - Theme system (persona, gruvbox, dracula, nord)
- `templates/` - Provider templates organized by category (e.g., `claude/*.json`)

### Key Patterns
- **ConfigStore** (singleton in `src/config/store.ts`) handles all persistence:
  - Provider config stored in `~/.persona/config.json`
  - Claude settings written to `~/.claude/settings.json`
  - General env config in `~/.persona/general.json`

- **Commands** use inquirer for interactive prompts and support both interactive and flag-based modes
  - Entry point parses flags with `util.parseArgs()`
  - Commands fall back to interactive mode if flags are missing

- **TUI Architecture** - Two implementations coexist:
  - **New (OpenTUI)**: React-based in `src/tui/` using `@opentui/core` and `@opentui/react`
    - Entry point: `src/tui/index.tsx` exports `startInteractiveMode()`
    - Component-based with proper React patterns
    - Theme loaded via `loadThemeFromConfig()` before rendering
  - **Legacy (blessed)**: Imperative in `src/utils/tui.ts`
    - Avoid manual `up()/down()` calls on lists; use `setTimeout` after key events
    - Still used but being phased out

- **Build System** uses Bun's `--compile` flag to create single-file executables
  - Version auto-updated via `scripts/update-version.ts` before builds
  - Output: `dist/persona` (platform-specific executable)

### Provider Configuration
Providers are configured with:
- `id` - Unique identifier (auto-generated)
- `name` - Display name
- `website` - Provider website URL
- `baseUrl` - API endpoint
- `apiKey` - Authentication token
- `apiFormat` - Either `anthropic-messages` or `openai-completions`
- `models` - Model mappings object with keys: `default`, `haiku`, `opus`, `sonnet`
- `extraEnv` - Additional environment variables (optional)

When switching providers, the tool:
1. Updates `~/.persona/config.json` with active provider
2. Writes provider settings to `~/.claude/settings.json`:
   - `ANTHROPIC_BASE_URL` - Provider's base URL
   - `ANTHROPIC_AUTH_TOKEN` - Provider's API key
   - `ANTHROPIC_MODEL` - Model mapping
   - Additional keys from `extraEnv`
3. Merges with environment overrides from `~/.persona/general.json`

### Template System
Provider templates in `templates/` directory are organized by category:
- `templates/claude/*.json` - Claude API-compatible providers
- Each template provides default values for baseUrl, apiFormat, models
- Access via `getTemplateNames()`, `getTemplateByFullName()`, `getTemplatesByCategory()`

### Theme System
Themes control TUI colors and are stored in `src/utils/tui/components.ts`:
- Available themes: `persona` (default), `gruvbox`, `dracula`, `nord`
- Theme persisted in `~/.persona/config.json`
- Loaded via `loadThemeFromConfig()` before TUI initialization
- Colors accessed via `getColors()` helper
