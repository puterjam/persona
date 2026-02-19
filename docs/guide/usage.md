# Usage

## Interactive Mode

Launch the interactive TUI:

```bash
persona
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate provider list |
| `Enter` | Switch to selected provider |
| `a` | Add new provider |
| `e` | Edit selected provider |
| `d` | Delete selected provider |
| `p` | Test ping selected provider |
| `t` | Change theme |
| `r` | Refresh provider list |
| `q` | Quit |

## Provider Templates

Persona supports multiple provider templates. List available templates:

```bash
persona templates
```

Add a provider using a template:

```bash
persona add --template openai --api-key sk-xxx
```

## Theme Management

```bash
# Show current theme
persona theme

# List available themes
persona theme list

# Switch to a theme
persona theme gruvbox
```

Available themes:
- `persona` - Default dark theme
- `gruvbox` - Vintage/gruvbox color scheme
- `dracula` - Popular purple dark theme
- `nord` - Arctic, north-bluish color palette

## Environment Variables

Manage environment variable overrides:

```bash
# Show current config
persona env

# Edit config
persona env edit
```

## Sync Templates and Themes

Update templates and themes from GitHub:

```bash
# Sync all
persona sync

# Sync only templates
persona sync --templates

# Sync only themes
persona sync --themes

# Force overwrite
persona sync --force
```
