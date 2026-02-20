// Switch command - switch to a different provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { Provider, CliTarget } from '../types';
import { maskApiKey } from '../utils/crypto/mask';
import { API_FORMAT_OPTIONS } from '../utils/constants';

export async function switchProviderInteractive(target: string = 'claude'): Promise<void> {
  const allProviders = configStore.getProviders();

  // Filter providers by target
  const providers = target === 'codex'
    ? allProviders.filter(p => p.target === 'codex')
    : allProviders.filter(p => !p.target || p.target === 'claude');

  const activeProvider = configStore.getActiveProvider(target as CliTarget);

  const resetLabel = target === 'codex' ? 'Reset Codex to default' : 'Reset to default (Anthropic official)';

  const choices: any[] = [
    {
      name: resetLabel,
      value: '__reset__',
      description: target === 'codex' ? 'Clear Codex custom configuration' : 'Clear custom configuration and use Anthropic default'
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
      message: `Select a ${target} provider to switch to:`,
      choices: choices
    }
  ]);

  if (selectedId === '__reset__') {
    resetToDefault(target);
  } else {
    switchProvider(selectedId, true, target as any);
  }
}

export function resetToDefault(target: string = 'claude'): void {
  try {
    configStore.clearProviderConfig(target as CliTarget);

    if (target === 'codex') {
      console.log(chalk.green('\nSuccessfully reset Codex to default\n'));
      console.log(chalk.cyan('You may need to restart Codex for changes to take effect.'));
    } else {
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
    }
  } catch (error) {
    console.log(chalk.red('Failed to reset configuration:'), error);
  }
}

export function switchProvider(providerId: string, update: boolean = true, target?: CliTarget): void {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  const isCodex = provider.target === 'codex';
  const resolvedTarget = target || provider.target || 'claude';

  try {
    // Apply provider configuration based on target
    configStore.applyProvider(provider, update);

    // Set as active provider
    configStore.setActiveProvider(providerId, resolvedTarget);

    console.log(chalk.green(`\nSuccessfully switched to provider: ${provider.name}\n`));
    console.log(chalk.bold('Applied settings:'));

    if (isCodex) {
      console.log(`  Target: Codex`);
      console.log(`  Base URL: ${provider.baseUrl}`);
      console.log(`  Model: ${provider.models.default || provider.models.haiku || 'gpt-4o'}`);
      if (provider.wireApi) console.log(`  Wire API: ${provider.wireApi}`);
      console.log(`  API Key: ${maskApiKey(provider.apiKey)}`);
      console.log();
      console.log(chalk.cyan('You may need to restart Codex for changes to take effect.'));
    } else {
      console.log(`  Target: Claude`);
      console.log(`  ANTHROPIC_BASE_URL: ${provider.baseUrl}`);
      console.log(`  ANTHROPIC_AUTH_TOKEN: ${maskApiKey(provider.apiKey)}`);
      if (provider.models.default) console.log(`  ANTHROPIC_MODEL: ${provider.models.default}`);
      if (provider.models.haiku) console.log(`  ANTHROPIC_DEFAULT_HAIKU_MODEL: ${provider.models.haiku}`);
      if (provider.models.opus) console.log(`  ANTHROPIC_DEFAULT_OPUS_MODEL: ${provider.models.opus}`);
      if (provider.models.sonnet) console.log(`  ANTHROPIC_DEFAULT_SONNET_MODEL: ${provider.models.sonnet}`);
      console.log();
      console.log(chalk.cyan('You may need to restart Claude CLI for changes to take effect.'));
    }
  } catch (error) {
    console.log(chalk.red('Failed to apply provider configuration:'), error);
  }
}

export function updateClaudeConfig(): void {
  const activeProvider = configStore.getActiveProvider('claude');

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
  const claudeProvider = configStore.getActiveProvider('claude');
  const codexProvider = configStore.getActiveProvider('codex');
  const claudeSettings = configStore.getActiveClaudeSettings();
  const generalConfig = configStore.getGeneralConfig();

  console.log(chalk.bold('\n=== Current Status ===\n'));

  // Claude Provider
  if (claudeProvider) {
    console.log(chalk.green('Active Claude Provider: ') + claudeProvider.name);
    console.log(`  ID: ${claudeProvider.id}`);
    console.log(`  Website: ${claudeProvider.website}`);
    console.log(`  API URL: ${claudeProvider.baseUrl}`);
    console.log(`  Format: ${claudeProvider.apiFormat}`);
  } else {
    console.log(chalk.yellow('No active Claude provider selected.'));
  }

  // Codex Provider
  if (codexProvider) {
    console.log(chalk.green('\nActive Codex Provider: ') + codexProvider.name);
    console.log(`  ID: ${codexProvider.id}`);
    console.log(`  Website: ${codexProvider.website}`);
    console.log(`  API URL: ${codexProvider.baseUrl}`);
    console.log(`  Format: ${codexProvider.apiFormat}`);
  } else {
    console.log(chalk.yellow('\nNo active Codex provider selected.'));
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
