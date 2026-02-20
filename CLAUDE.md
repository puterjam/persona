# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Persona** - CLI tool to switch Claude CLI between different model providers (DeepSeek, Zhipu GLM, Kimi, MiniMax, OpenAI, Ollama, etc.)

## Run

```bash
bun run dev    # Development mode
bun run build  # Build executable (dist/persona)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | CLI entry, command routing |
| `src/commands/*.ts` | Command implementations (add, switch, list, rm, edit, ping, theme, env, sync) |
| `src/config/store.ts` | ConfigStore singleton - all persistence |
| `src/tui/` | React/OpenTUI TUI components |
| `src/utils/theme.ts` | Theme system (persona, gruvbox, dracula, nord) |
| `templates/` | Provider templates by category |

## Important Patterns

- **Switch provider**: Call both `applyProviderToClaude()` and `setActiveProvider()` in `src/config/store.ts`
- **TUI**: Theme loaded via `loadThemeFromConfig()` before rendering
- **Config locations**:
  - `~/.persona/config.json` - provider config
  - `~/.claude/settings.json` - Claude settings (written by this tool)

## Add New

- **Command**: Add to `src/commands/<name>.ts`, import in `src/index.ts`
- **Template**: Add JSON to `templates/<category>/<name>.json` with name, baseUrl, apiFormat, models
- **Theme**: Add to `src/utils/theme.ts` themes object
