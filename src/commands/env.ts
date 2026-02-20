import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import { configStore } from '../config/store';
import { GeneralConfig } from '../types';
import { maskApiKey } from '../utils/crypto/mask';

const DEFAULT_CLAUDE_CONFIG = `{
  "env": {}
}`;

const DEFAULT_CODEX_CONFIG = `
# Common Codex config
# Add your common TOML configuration here
`;

function detectEditor(): string {
  const hasDisplay = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;

  const vscodePaths = [
    'code',
    '/usr/local/bin/code',
    '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
  ];

  for (const p of vscodePaths) {
    try {
      if (p === 'code') {
        execSync('which code', { stdio: 'ignore' });
      }
      if (hasDisplay || process.platform === 'darwin') {
        return 'code';
      }
    } catch {
      // continue
    }
  }

  try {
    execSync('which vim', { stdio: 'ignore' });
    return 'vim';
  } catch {
    return 'nano';
  }
}

function openInEditor(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }

  const editor = detectEditor();
  console.log(chalk.cyan(`Opening with: ${editor}`));

  try {
    execSync(`${editor} "${filePath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('Failed to open editor:', error));
    process.exit(1);
  }
}

export function showEnvConfig(): void {
  // Show Claude config
  const claudeConfig = configStore.getGeneralConfig();

  console.log(chalk.bold('\n=== Claude Environment Variables ===\n'));

  let hasClaudeConfig = false;

  // Display all top-level keys
  for (const [key, value] of Object.entries(claudeConfig)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - display its contents
      console.log(chalk.bold(`  ${key}:`));
      for (const [subKey, subValue] of Object.entries(value as Record<string, any>)) {
        if (subValue && typeof subValue === 'string' && subValue.length > 0) {
          hasClaudeConfig = true;
          if (subKey.toLowerCase().includes('key') || subKey.toLowerCase().includes('token') || subKey.toLowerCase().includes('secret')) {
            console.log(`    ${subKey}: ${maskApiKey(subValue)}`);
          } else {
            console.log(`    ${subKey}: ${subValue}`);
          }
        }
      }
    } else if (value && typeof value === 'string' && value.length > 0) {
      hasClaudeConfig = true;
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        console.log(`  ${key}: ${maskApiKey(value)}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  }

  if (!hasClaudeConfig) {
    console.log(chalk.gray('  (none)'));
  }

  // Show Codex config
  console.log(chalk.bold('\n=== Codex Settings ===\n'));

  const codexConfig = configStore.getCodexGeneralConfig();
  if (codexConfig && Object.keys(codexConfig).length > 0) {
    for (const [key, value] of Object.entries(codexConfig)) {
      console.log(`  ${key}: ${value}`);
    }
  } else {
    console.log(chalk.gray('  (none)'));
  }

  console.log();
  console.log(chalk.cyan('Run "persona env edit claude|codex" to modify these settings.\n'));
}

export function editEnvConfig(args: string[]): void {
  const target = args[0] || 'claude';

  if (target === 'codex') {
    // Edit Codex config (TOML)
    const configPath = configStore.getCodexGeneralConfigPath();

    // If file exists, use existing content to preserve comments
    let initialContent = DEFAULT_CODEX_CONFIG;
    if (fs.existsSync(configPath)) {
      initialContent = fs.readFileSync(configPath, 'utf-8');
    }

    console.log(chalk.bold('\nCodex Settings Editor (TOML)\n'));
    openInEditor(configPath, initialContent);

    try {
      if (fs.existsSync(configPath)) {
        // Just validate the TOML - don't save back to preserve comments
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = toml.parse(content);
        console.log(chalk.green('\nConfiguration saved successfully.\n'));
      }
    } catch (error) {
      console.log(chalk.red('Failed to read configuration:', error));
    }
  } else {
    // Edit Claude config (JSON)
    const configPath = configStore.getGeneralConfigPath();

    // If file exists, use existing content
    let initialContent = DEFAULT_CLAUDE_CONFIG;
    if (fs.existsSync(configPath)) {
      initialContent = fs.readFileSync(configPath, 'utf-8');
    }

    console.log(chalk.bold('\nClaude Environment Variables Editor (JSON)\n'));
    console.log('These variables will be merged with provider config on activation.');
    console.log('Provider config has higher priority and can override these values.\n');

    openInEditor(configPath, initialContent);

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      JSON.parse(content); // Just validate JSON
      console.log(chalk.green('\nConfiguration saved successfully.\n'));
    } catch (error) {
      console.log(chalk.red('Failed to read configuration:', error));
    }
  }
}
