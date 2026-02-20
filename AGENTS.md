# AGENTS.md - Developer Guide for Persona

This file provides guidance for AI agents working on this codebase.

## Project Overview

**Persona** is a CLI tool to switch Claude CLI configurations between different model providers (DeepSeek, Zhipu GLM, Kimi, MiniMax, OpenAI, Ollama, etc.).

## Build & Run Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Build executable
bun run build

# Development mode (run without building)
bun run dev

# Build and globally link (for CLI usage)
bun run link

# Documentation
bun run docs:dev       # Start docs dev server
bun run docs:build     # Build docs
bun run docs:preview  # Preview docs
```

## Project Structure

```
src/
├── index.ts           # CLI entry point, command routing
├── cli/              # CLI infrastructure (commands definition, help)
├── commands/         # Command implementations (add, switch, list, etc.)
├── config/           # Configuration management (store, templates)
├── types/            # TypeScript interfaces
├── utils/            # Utilities (api, crypto, theme, etc.)
│   ├── api/          # API testing utilities
│   └── crypto/       # Cryptographic utilities (masking)
└── tui/              # Terminal UI (OpenTUI/React-based)
    ├── components/   # UI components
    │   ├── layout/   # Header, StatusBar
    │   ├── detail/   # DetailPanel subcomponents
    │   ├── dialogs/  # Confirm, Input, List dialogs
    │   └── types/    # TUI-specific types
    └── hooks/        # Custom React hooks
```

## Code Style Guidelines

### TypeScript

- Use **strict mode** (`strict: true` in tsconfig.json)
- Always define return types for functions when not obvious
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any`, use `unknown` when type is uncertain

### Naming Conventions

- **Files**: camelCase (e.g., `useProviders.ts`, `apiUtils.ts`)
- **Components**: PascalCase (e.g., `DetailPanel.tsx`)
- **Interfaces**: PascalCase with `I` prefix only when necessary (prefer without)
- **Constants**: SCREAMING_SNAKE_CASE
- **Boolean variables**: prefix with `is`, `has`, `should`, `can`

### Imports

- Use absolute imports from project root (e.g., `@/utils/api`)
- Order imports: external → internal → types
- Use explicit file extensions for clarity: `from '../utils/api/index'`
- Group by: React hooks → external libs → internal modules → types

```typescript
// Good
import { useState, useCallback } from "react"
import type { CliRenderer } from "@opentui/core"
import { testProvider } from "../../utils/api"
import type { Provider } from "../../types"
import { configStore } from "../../config/store"
```

### React/TUI Patterns

- Use functional components with hooks
- Extract custom hooks for reusable logic (`useXxx`)
- Use `useCallback` for event handlers passed to child components
- Keep components focused: single responsibility
- Lift state up; avoid redundant local state

### Error Handling

- Use try/catch for async operations
- Provide meaningful error messages
- Exit with `process.exit(1)` on CLI errors
- Use `chalk.red()` for errors, `chalk.yellow()` for warnings

### UI Components (OpenTUI)

- Use JSX-style syntax with `@opentui/react`
- Available elements: `box`, `text`, `select`, `input`, `button`
- Use `position`, `width`, `height`, `flexDirection` for layout
- Apply colors from `themeColors` for consistency

### Formatting

- Use **double quotes** for strings
- Use **2 spaces** for indentation
- Add trailing commas in objects/arrays
- Maximum line length: 100 characters (soft limit)
- No semicolons at end of statements
- Use semicolons in TypeScript type definitions

### Best Practices

1. **Configuration**: Use `ConfigStore` singleton for persistence
2. **Provider switching**: Always call both `applyProviderToClaude()` and `setActiveProvider()`
3. **Theme**: Load theme via `loadThemeFromConfig()` before TUI initialization
4. **Dialogs**: Use Promise-based pattern (see `useDialogs` hook)
5. **Testing**: Test provider connectivity with `testProvider()` utility

## Testing

This project does not have a formal test suite yet. When adding tests:

- Use Vitest or Bun's built-in test runner
- Place tests alongside source files with `.test.ts` extension
- Mock external dependencies (file system, HTTP requests)

## Common Tasks

### Adding a new command

1. Create `src/commands/<command>.ts`
2. Export interactive function and optionally flag-based function
3. Import and add to switch case in `src/index.ts`

### Adding a new provider template

1. Add JSON file to `templates/<category>/<name>.json`
2. Template should include: name, website, baseUrl, apiFormat, defaultModels

### Adding a new theme

1. Add theme colors to `src/utils/theme.ts` in `themes` object
2. Theme colors should include: bg, text, primary, border, etc.
