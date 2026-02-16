# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Persona** is a CLI tool to switch Claude CLI configurations between different model providers. It allows users to configure and switch between 20+ AI model providers (DeepSeek, Zhipu GLM, Kimi, MiniMax, OpenAI, Ollama, etc.).

## Commands

```bash
pnpm install    # Install dependencies
pnpm build      # Compile TypeScript to dist/
pnpm dev        # Run in development mode (ts-node)
pnpm start      # Run compiled JavaScript
pnpm link       # Build and globally link (for CLI usage)
```

## Architecture

### File Structure
- `src/index.ts` - Entry point, CLI command routing
- `src/commands/` - Individual command implementations (add, switch, list, delete, edit, test, config)
- `src/config/store.ts` - Configuration management (singleton ConfigStore class)
- `src/config/templates.ts` - Provider template loading from `templates/` directory
- `src/types/index.ts` - TypeScript interfaces
- `src/utils/tui.ts` - Terminal UI using blessed
- `src/utils/api.ts` - API testing utilities
- `templates/` - Provider templates (JSON files organized by category)

### Key Patterns
- **ConfigStore** (singleton in `src/config/store.ts`) handles all persistence:
  - Provider config stored in `~/.persona/config.json`
  - Claude settings written to `~/.claude/settings.json`
  - General env config in `~/.persona/general.json`

- **Commands** use inquirer for interactive prompts and support both interactive and flag-based modes

- **TUI** uses blessed library - avoid manual `up()/down()` calls on lists; use `setTimeout` after key events to get selected item

### Provider Configuration
Providers are configured with:
- `baseUrl` - API endpoint
- `apiKey` - Authentication
- `apiFormat` - Either `anthropic-messages` or `openai-completions`
- `models` - Model mappings for haiku/opus/sonnet tiers
- `extraEnv` - Additional environment variables

When switching providers, the tool writes environment variables to Claude's settings (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, etc.).
