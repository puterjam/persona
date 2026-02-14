// Edit command - edit an existing provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { Provider } from '../types';

export async function editProviderInteractive(providerId: string): Promise<void> {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Provider name:',
      default: provider.name
    },
    {
      type: 'input',
      name: 'website',
      message: 'Website URL:',
      default: provider.website
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'API Base URL:',
      default: provider.baseUrl
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'API Key (leave empty to keep current):',
      default: '',
      validate: (input) => input.length > 0 ? true : true // Allow empty to keep current
    },
    {
      type: 'list',
      name: 'apiFormat',
      message: 'API Format:',
      default: provider.apiFormat,
      choices: [
        { name: 'Anthropic Messages API', value: 'anthropic-messages' },
        { name: 'OpenAI Chat Completions API', value: 'openai-completions' }
      ]
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Default model name:',
      default: provider.models.default || ''
    },
    {
      type: 'input',
      name: 'haikuModel',
      message: 'Haiku model name:',
      default: provider.models.haiku || ''
    },
    {
      type: 'input',
      name: 'opusModel',
      message: 'Opus model name:',
      default: provider.models.opus || ''
    },
    {
      type: 'input',
      name: 'sonnetModel',
      message: 'Sonnet model name:',
      default: provider.models.sonnet || ''
    }
  ]);

  const updates: Partial<Provider> = {
    name: answers.name,
    website: answers.website,
    baseUrl: answers.baseUrl,
    apiFormat: answers.apiFormat as 'anthropic-messages' | 'openai-completions',
    models: {
      default: answers.defaultModel || undefined,
      haiku: answers.haikuModel || undefined,
      opus: answers.opusModel || undefined,
      sonnet: answers.sonnetModel || undefined
    }
  };

  // Only update API key if provided
  if (answers.apiKey) {
    updates.apiKey = answers.apiKey;
  }

  configStore.updateProvider(providerId, updates);

  console.log(chalk.green(`\nProvider "${answers.name}" updated successfully!`));
}

export function editProviderFromArgs(providerId: string, args: {
  name?: string;
  website?: string;
  baseUrl?: string;
  apiKey?: string;
  apiFormat?: string;
  defaultModel?: string;
  haikuModel?: string;
  opusModel?: string;
  sonnetModel?: string;
}): void {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  const updates: Partial<Provider> = {};

  if (args.name) updates.name = args.name;
  if (args.website) updates.website = args.website;
  if (args.baseUrl) updates.baseUrl = args.baseUrl;
  if (args.apiKey) updates.apiKey = args.apiKey;
  if (args.apiFormat) {
    updates.apiFormat = args.apiFormat as 'anthropic-messages' | 'openai-completions';
  }

  if (args.defaultModel || args.haikuModel || args.opusModel || args.sonnetModel) {
    updates.models = {
      default: args.defaultModel || provider.models.default,
      haiku: args.haikuModel || provider.models.haiku,
      opus: args.opusModel || provider.models.opus,
      sonnet: args.sonnetModel || provider.models.sonnet
    };
  }

  if (Object.keys(updates).length === 0) {
    console.log(chalk.yellow('No changes specified. Use --help to see available options.'));
    return;
  }

  configStore.updateProvider(providerId, updates);

  console.log(chalk.green(`\nProvider "${provider.name}" updated successfully!`));
}
