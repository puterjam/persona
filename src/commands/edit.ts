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

  const isCodex = provider.target === 'codex';

  const questions: any[] = [
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
      validate: (input: string) => input.length > 0 ? true : true
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Default model name:',
      default: provider.models.default || ''
    }
  ];

  if (isCodex) {
    questions.push({
      type: 'input',
      name: 'wireApi',
      message: 'Wire API (responses/completions):',
      default: provider.wireApi || 'responses'
    });
    questions.push({
      type: 'confirm',
      name: 'requiresOpenAiAuth',
      message: 'Requires OpenAI authentication?',
      default: provider.requiresOpenAiAuth !== false
    });
  } else {
    questions.push({
      type: 'input',
      name: 'haikuModel',
      message: 'Haiku model name:',
      default: provider.models.haiku || ''
    });
    questions.push({
      type: 'input',
      name: 'opusModel',
      message: 'Opus model name:',
      default: provider.models.opus || ''
    });
    questions.push({
      type: 'input',
      name: 'sonnetModel',
      message: 'Sonnet model name:',
      default: provider.models.sonnet || ''
    });
  }

  const answers = await inquirer.prompt(questions);

  const updates: Partial<Provider> = {
    name: answers.name,
    website: answers.website,
    baseUrl: answers.baseUrl,
    models: {
      default: answers.defaultModel || undefined
    }
  };

  if (isCodex) {
    updates.wireApi = answers.wireApi;
    updates.requiresOpenAiAuth = answers.requiresOpenAiAuth;
  } else {
    updates.models.haiku = answers.haikuModel || undefined;
    updates.models.opus = answers.opusModel || undefined;
    updates.models.sonnet = answers.sonnetModel || undefined;
  }

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
