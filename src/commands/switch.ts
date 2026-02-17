// Switch command - switch to a different provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { Provider } from '../types';
import { maskApiKey } from '../utils/mask';
import { API_FORMAT_OPTIONS } from '../utils/constants';

export async function switchProviderInteractive(): Promise<void> {
  const providers = configStore.getProviders();
  const activeProvider = configStore.getActiveProvider();

  const choices: any[] = [
    {
      name: 'Reset to default (Anthropic official)',
      value: '__reset__',
      description: 'Clear custom configuration and use Anthropic default'
    }
  ];

  if (providers.length > 0) {
    choices.push(new inquirer.Separator('--- Custom Providers ---'));
    providers.forEach(p => {
      choices.push({
        name: `${p.name}${activeProvider?.id === p.id ? ' (current)' : ''}`,
        value: p.id
      });
    });
  }

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: 'Select a provider to switch to:',
      choices: choices
    }
  ]);

  if (selectedId === '__reset__') {
    resetToDefault();
  } else {
    switchProvider(selectedId);
  }
}

export function resetToDefault(): void {
  try {
    configStore.clearProviderConfig();
    console.log(chalk.green('\nSuccessfully reset to default (Anthropic official)\n'));
    console.log(chalk.bold('Cleared settings:'));
    console.log('  ANTHROPIC_BASE_URL');
    console.log('  ANTHROPIC_AUTH_TOKEN');
    console.log('  ANTHROPIC_MODEL');
    console.log('  ANTHROPIC_DEFAULT_HAIKU_MODEL');
    console.log('  ANTHROPIC_DEFAULT_OPUS_MODEL');
    console.log('  ANTHROPIC_DEFAULT_SONNET_MODEL');
    console.log();
    console.log(chalk.cyan('You may need to restart Claude CLI for changes to take effect.'));
  } catch (error) {
    console.log(chalk.red('Failed to reset configuration:'), error);
  }
}

export function switchProvider(providerId: string, updateClaude: boolean = true): void {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  try {
    // Apply provider configuration to Claude settings
    configStore.applyProviderToClaude(provider, updateClaude);

    // Set as active provider
    configStore.setActiveProvider(providerId);

    console.log(chalk.green(`\nSuccessfully switched to provider: ${provider.name}\n`));
    console.log(chalk.bold('Applied settings:'));
    console.log(`  ANTHROPIC_BASE_URL: ${provider.baseUrl}`);
    console.log(`  ANTHROPIC_AUTH_TOKEN: ${maskApiKey(provider.apiKey)}`);
    if (provider.models.default) console.log(`  ANTHROPIC_MODEL: ${provider.models.default}`);
    if (provider.models.haiku) console.log(`  ANTHROPIC_DEFAULT_HAIKU_MODEL: ${provider.models.haiku}`);
    if (provider.models.opus) console.log(`  ANTHROPIC_DEFAULT_OPUS_MODEL: ${provider.models.opus}`);
    if (provider.models.sonnet) console.log(`  ANTHROPIC_DEFAULT_SONNET_MODEL: ${provider.models.sonnet}`);
    console.log();
    console.log(chalk.cyan('You may need to restart Claude CLI for changes to take effect.'));
  } catch (error) {
    console.log(chalk.red('Failed to apply provider configuration:'), error);
  }
}

export function updateClaudeConfig(): void {
  const activeProvider = configStore.getActiveProvider();

  if (!activeProvider) {
    console.log(chalk.yellow('No active provider. Use "persona use <provider-id>" first.'));
    return;
  }

  try {
    // Re-apply provider + general config to Claude settings
    configStore.applyProviderToClaude(activeProvider, true);

    console.log(chalk.green(`\nSuccessfully updated Claude configuration.\n`));
    console.log(chalk.bold('Applied:'));
    console.log('  - General configuration');
    console.log(`  - Provider: ${activeProvider.name}`);
    console.log();
    console.log(chalk.cyan('You may need to restart Claude CLI for changes to take effect.'));
  } catch (error) {
    console.log(chalk.red('Failed to update configuration:'), error);
  }
}

export function showStatus(): void {
  const activeProvider = configStore.getActiveProvider();
  const claudeSettings = configStore.getActiveClaudeSettings();
  const generalConfig = configStore.getGeneralConfig();

  console.log(chalk.bold('\n=== Current Status ===\n'));

  // Active Provider
  if (activeProvider) {
    console.log(chalk.green('Active Provider: ') + activeProvider.name);
    console.log(`  ID: ${activeProvider.id}`);
    console.log(`  Website: ${activeProvider.website}`);
    console.log(`  API URL: ${activeProvider.baseUrl}`);
    console.log(`  Format: ${activeProvider.apiFormat}`);
  } else {
    console.log(chalk.yellow('No active provider selected.'));
  }

  // Environment Overrides
  console.log(chalk.bold('\n--- Environment Overrides ---'));
  if (generalConfig && Object.keys(generalConfig).length > 0) {
    for (const [key, value] of Object.entries(generalConfig)) {
      if (typeof value === 'string' && value) {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
          console.log(`  ${key}: ${maskApiKey(value)}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(chalk.bold(`  ${key}:`));
        for (const [subKey, subValue] of Object.entries(value)) {
          if (typeof subValue === 'string' && subValue) {
            if (subKey.toLowerCase().includes('key') || subKey.toLowerCase().includes('token')) {
              console.log(`    ${subKey}: ${maskApiKey(subValue)}`);
            } else {
              console.log(`    ${subKey}: ${subValue}`);
            }
          }
        }
      }
    }
  } else {
    console.log(chalk.gray('  (none)'));
  }

  // Current Claude Settings
  console.log(chalk.bold('\n--- Current Claude Settings ---'));
  if (Object.keys(claudeSettings).length > 0) {
    for (const [key, value] of Object.entries(claudeSettings)) {
      if (value) {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
          console.log(`  ${key}: ${maskApiKey(value)}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }
  } else {
    console.log(chalk.gray('  (none)'));
  }

  console.log();
}
