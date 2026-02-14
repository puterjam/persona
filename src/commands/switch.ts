// Switch command - switch to a different provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { Provider } from '../types';

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

export function switchProvider(providerId: string): void {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  try {
    // Apply provider configuration to Claude settings
    configStore.applyProviderToClaude(provider);

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

function maskApiKey(key: string): string {
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

export function showStatus(): void {
  const activeProvider = configStore.getActiveProvider();
  const claudeSettings = configStore.getActiveClaudeSettings();

  console.log(chalk.bold('\nCurrent Status:\n'));

  if (activeProvider) {
    console.log(chalk.green('Active Provider: ') + activeProvider.name);
    console.log(`  ID: ${activeProvider.id}`);
    console.log(`  Website: ${activeProvider.website}`);
    console.log(`  API URL: ${activeProvider.baseUrl}`);
    console.log(`  Format: ${activeProvider.apiFormat}`);
  } else {
    console.log(chalk.yellow('No active provider selected.'));
  }

  console.log(chalk.bold('\nClaude Settings:'));
  const importantKeys = [
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL'
  ];

  importantKeys.forEach(key => {
    const value = claudeSettings[key];
    if (value) {
      if (key === 'ANTHROPIC_AUTH_TOKEN') {
        console.log(`  ${key}: ${maskApiKey(value)}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  });

  console.log();
}
