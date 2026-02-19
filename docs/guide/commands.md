# Commands Reference

## Main Commands

### `persona`

Launch interactive TUI mode.

### `persona ls`

List all configured providers.

```bash
persona ls
```

### `persona use <id>`

Switch to a provider by ID.

```bash
persona use abc12345
```

### `persona add`

Add a new provider interactively or with flags.

```bash
# Interactive mode
persona add

# With flags
persona add --template openai --name "My OpenAI" --api-key sk-xxx
```

**Options:**
- `--template<name>` - Use  a provider template
- `--name <name>` - Provider name
- `--base-url <url>` - API base URL
- `--api-key <key>` - API key
- `--default-model <model>` - Default model
- `--haiku-model <model>` - Haiku model
- `--opus-model <model>` - Opus model
- `--sonnet-model <model>` - Sonnet model

### `persona edit <id>`

Edit an existing provider.

```bash
persona edit abc12345
```

### `persona rm <id>`

Delete a provider.

```bash
persona rm abc12345
```

### `persona ping [id]`

Test provider API connection.

```bash
persona ping abc12345
```

### `persona status`

Show current active provider and configuration.

```bash
persona status
```

## Template & Theme Commands

### `persona templates`

List available provider templates.

```bash
persona templates
```

### `persona theme`

Manage themes.

```bash
persona theme              # Show current theme
persona theme list        # List available themes
persona theme <name>      # Switch to a theme
```

### `persona sync`

Sync templates and themes from GitHub.

```bash
persona sync                    # Sync all
persona sync --templates       # Sync only templates
persona sync --themes         # Sync only themes
persona sync --force          # Force overwrite
```

## Config Commands

### `persona env`

Manage environment variable overrides.

```bash
persona env              # Show current config
persona env edit        # Edit config
```

## Help

### `persona help`

Show help information.

```bash
persona help
persona help use
```
