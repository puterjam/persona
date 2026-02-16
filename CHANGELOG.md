# Changelog

## v1.0.0

### Features
- **Interactive TUI Mode** - Terminal user interface with keyboard navigation
- **Provider Management** - Add, edit, delete, and switch between AI providers
- **Multi-platform Support** - Builds for macOS (ARM64/x64), Linux (x64/ARM64), Windows x64
- **20+ Provider Templates** - Including DeepSeek, Zhipu GLM, Kimi, MiniMax, Ollama, OpenAI, and more
- **Ping Testing** - Test API connectivity directly from TUI
- **Config Editor** - Edit general configuration in external editor
- **ASCII Art Title** - Stylish header with "Persona" ASCII font
- **Dynamic Version** - Auto-generated version from package.json

### Fixes
- Extract hardcoded colors to centralized theme
- Fix TUI mouse click handling
- Fix provider list navigation with blessed
- Fix Chinese locale display (UTF-8)
- Fix auto-show provider details when navigating
- Fix ESC key behavior in dialogs
- Fix cross-platform build dependencies

### CI/CD
- GitHub Actions release workflow
- Multi-platform compilation (darwin/linux/windows)
- Auto tag creation on version bump
