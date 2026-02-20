// Config command - edit general configuration

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import { configStore } from '../config/store';
import { GeneralConfig } from '../types';
import { maskApiKey } from '../utils/crypto/mask';
import { getThemeNames, loadTheme } from '../utils/theme';

const DEFAULT_CONFIG = `{
  "CLAUDE_API_KEY": "",
  "ANTHROPIC_PROJECT_ID": "",
  "ANTHROPIC_ORGANIZATION_ID": "",
  "ANTHROPIC_MAX_TOKENS": "4096"
}`;

function detectEditor(): string {
  // Check if running in desktop environment (has DISPLAY or WAYLAND_DISPLAY)
  const hasDisplay = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;

  // Check for VS Code
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

  // Default to vim/nano
  try {
    execSync('which vim', { stdio: 'ignore' });
    return 'vim';
  } catch {
    return 'nano';
  }
}

function openInEditor(filePath: string, content: string): void {
  // Ensure file exists with default content
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

function validateConfig(content: string): { valid: boolean; config?: GeneralConfig; error?: string } {
  try {
    const config = JSON.parse(content);
    if (!config || typeof config !== 'object') {
      return { valid: false, error: 'Config must be a valid JSON object' };
    }
    return { valid: true, config };
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error}` };
  }
}

export function editGeneralConfig(): void {
  const configPath = configStore.getGeneralConfigPath();

  // Show current config if exists
  const currentConfig = configStore.getGeneralConfig();
  let initialContent = DEFAULT_CONFIG;

  if (currentConfig && Object.keys(currentConfig).length > 0) {
    initialContent = JSON.stringify(currentConfig, null, 2);
  }

  console.log(chalk.bold('\nGeneral Configuration Editor\n'));
  console.log('This configuration will be merged with provider config on activation.');
  console.log('Provider config has higher priority and can override these values.\n');

  // Open editor
  openInEditor(configPath, initialContent);

  // Validate after editing
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const result = validateConfig(content);

    if (!result.valid) {
      console.log(chalk.red(`\nInvalid configuration: ${result.error}`));
      console.log(chalk.yellow('Keeping previous configuration.'));
      return;
    }

    configStore.saveGeneralConfig(result.config!);
    console.log(chalk.green('\nConfiguration saved successfully.\n'));
  } catch (error) {
    console.log(chalk.red('Failed to read configuration:', error));
  }
}

export function showGeneralConfig(): void {
  const config = configStore.getGeneralConfig();

  console.log(chalk.bold('\nGeneral Configuration:\n'));

  if (!config || Object.keys(config).length === 0) {
    console.log(chalk.yellow('No general configuration set.'));
    console.log('Run "persona config edit" to add general settings.\n');
    return;
  }

  for (const [key, value] of Object.entries(config)) {
    if (value && typeof value === 'object') {
      console.log(chalk.bold(`${key}:`));
      for (const [subKey, subValue] of Object.entries(value as Record<string, string>)) {
        if (subValue && subValue.length > 0) {
          if (subKey.toLowerCase().includes('key') || subKey.toLowerCase().includes('token') || subKey.toLowerCase().includes('secret')) {
            console.log(`  ${subKey}: ${maskApiKey(subValue)}`);
          } else {
            console.log(`  ${subKey}: ${subValue}`);
          }
        }
      }
    } else if (value && typeof value === 'string' && value.length > 0) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        console.log(`  ${key}: ${maskApiKey(value)}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  }
  console.log();
}

export function showThemeConfig(): void {
  const currentTheme = configStore.getTheme();
  const themeNames = getThemeNames();

  console.log(chalk.bold('\nTheme Configuration:\n'));
  console.log(`Current theme: ${chalk.cyan(currentTheme)}`);
  console.log(chalk.bold('\nAvailable themes:'));
  
  for (const name of themeNames) {
    const marker = name === currentTheme ? ' ✓' : '';
    console.log(`  ${name}${marker}`);
  }
  console.log();
  console.log('Use "persona config theme <name>" to switch theme.\n');
}

export function setTheme(themeName: string): void {
  const themeNames = getThemeNames();
  
  if (!themeNames.includes(themeName)) {
    console.log(chalk.red(`Theme "${themeName}" not found.`));
    console.log(chalk.yellow(`Available themes: ${themeNames.join(', ')}`));
    return;
  }

  const colors = loadTheme(themeName);
  if (!colors) {
    console.log(chalk.red(`Failed to load theme "${themeName}".`));
    return;
  }

  configStore.setTheme(themeName);
  console.log(chalk.green(`\nTheme "${themeName}" applied successfully!\n`));
}
