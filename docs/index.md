---
layout: home
---

<div align="center">

<pre style="background: transparent; border: none; font-family: monospace;">
█▀█ █▀▀ █▀█ █▀▀ █▀█ █▄ █ ▄▀█
█▀▀ ██▄ █▀▄ ▄▄█ █▄█ █ ▀█ █▀█
AI Coding CLI Provider Manager
</pre>

<div class="badges">

[![GitHub release](https://img.shields.io/github/release/puterjam/persona.svg)](https://github.com/puterjam/persona/releases/latest)

</div>

<img class="screenshot" src="https://github.com/puterjam/persona/blob/dev/docs/screenshot.png?raw=true" width="50%" />

<style>
.badges {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
.screenshot {
  border-radius: 8px;
}
</style>

</div>

## Features

<div class="grid-container">

<div class="feature-card">

**🤖 Multi-Provider Support**

Switch between 20+ AI model providers including DeepSeek, Zhipu GLM, Kimi, MiniMax, OpenAI, Ollama, and more.

</div>

<div class="feature-card">

**🎯 Claude & Codex Support**

Manage providers for both Anthropic Claude CLI and OpenAI Codex CLI with a single tool.

</div>

<div class="feature-card">

**🎨 Theme System**

Multiple color themes including Persona (default), Gruvbox, Dracula, and Nord. Customize your experience.

</div>

<div class="feature-card">

**📡 API Testing**

Test provider connectivity with detailed timing breakdown: DNS, CONNECT, TTFB, and API response times.

</div>

<div class="feature-card">

**⌨️ Interactive TUI**

Beautiful terminal user interface with keyboard navigation. Press `?` for help.

</div>

</div>

## Quick Install

```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash
```

## Getting Started

```bash
# Launch interactive mode
persona

# List providers (Claude - default)
persona ls

# List Codex providers
persona ls --target codex

# Add a provider (Claude - default)
persona add

# Add a Codex provider
persona add --target codex

# Switch provider
persona use <provider-id>
persona use --target codex <provider-id>

# For Codex, use the default config
codex

# Test connection
persona ping
```

<p align="center">

[View on GitHub](https://github.com/puterjam/persona) · [Report Bug](https://github.com/puterjam/persona/issues)

</p>

<style>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.feature-card {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.feature-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.feature-card p {
  margin: 0;
}
</style>
