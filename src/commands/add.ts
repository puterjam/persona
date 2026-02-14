// Add command - add a new provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { getTemplateNames, getTemplateByFullName, getCategoryNames, getTemplatesByCategory } from '../config/templates';
import { Provider, ProviderTemplate } from '../types';
import * as crypto from 'crypto';

export async function addProviderInteractive(): Promise<void> {
  const templateNames = getTemplateNames();

  const { useTemplate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useTemplate',
      message: 'Would you like to use a provider template?',
      default: true
    }
  ]);

  let template: ProviderTemplate | undefined;
  let provider: Partial<Provider> = {
    models: {}
  };

  if (useTemplate) {
    const { selectedTemplate } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTemplate',
        message: 'Select a provider template:',
        choices: templateNames.map(name => ({
          name: `${getTemplateByFullName(name)?.name} - ${getTemplateByFullName(name)?.description}`,
          value: name
        }))
      }
    ]);

    template = getTemplateByFullName(selectedTemplate);
    if (template) {
      provider = {
        name: template.name,
        website: template.website,
        baseUrl: template.baseUrl,
        apiFormat: template.apiFormat,
        models: { ...template.defaultModels }
      };
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Provider name:',
      default: provider.name,
      validate: (input) => input.length > 0 ? true : 'Name is required'
    },
    {
      type: 'input',
      name: 'website',
      message: 'Website URL:',
      default: provider.website || 'https://example.com'
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'API Base URL:',
      default: provider.baseUrl,
      validate: (input) => input.length > 0 ? true : 'Base URL is required'
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'API Key:',
      validate: (input) => input.length > 0 ? true : 'API Key is required'
    },
    {
      type: 'list',
      name: 'apiFormat',
      message: 'API Format:',
      default: provider.apiFormat || 'anthropic-messages',
      choices: [
        { name: 'Anthropic Messages API', value: 'anthropic-messages' },
        { name: 'OpenAI Chat Completions API', value: 'openai-completions' }
      ]
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Default model name:',
      default: provider.models?.default
    },
    {
      type: 'input',
      name: 'haikuModel',
      message: 'Haiku model name (optional):',
      default: provider.models?.haiku
    },
    {
      type: 'input',
      name: 'opusModel',
      message: 'Opus model name (optional):',
      default: provider.models?.opus
    },
    {
      type: 'input',
      name: 'sonnetModel',
      message: 'Sonnet model name (optional):',
      default: provider.models?.sonnet
    }
  ]);

  const newProvider: Provider = {
    id: generateProviderId(answers.name),
    name: answers.name,
    website: answers.website,
    apiKey: answers.apiKey,
    baseUrl: answers.baseUrl,
    apiFormat: answers.apiFormat as 'anthropic-messages' | 'openai-completions',
    models: {
      default: answers.defaultModel || undefined,
      haiku: answers.haikuModel || undefined,
      opus: answers.opusModel || undefined,
      sonnet: answers.sonnetModel || undefined
    }
  };

  configStore.addProvider(newProvider);

  console.log(chalk.green(`\nProvider "${newProvider.name}" added successfully!`));
  console.log(`Provider ID: ${newProvider.id}`);
}

export function addProviderFromArgs(args: {
  name?: string;
  website?: string;
  baseUrl?: string;
  apiKey?: string;
  apiFormat?: string;
  defaultModel?: string;
  haikuModel?: string;
  opusModel?: string;
  sonnetModel?: string;
  template?: string;
}): void {
  let provider: Partial<Provider> = { models: {} };

  // If template specified, use it
  if (args.template) {
    const template = getTemplateByFullName(args.template);
    if (!template) {
      console.log(chalk.red(`Template "${args.template}" not found.`));
      console.log(chalk.yellow(`Available templates: ${getTemplateNames().join(', ')}`));
      return;
    }
    provider = {
      name: template.name,
      website: template.website,
      baseUrl: template.baseUrl,
      apiFormat: template.apiFormat,
      models: { ...template.defaultModels }
    };
  }

  // Merge command line arguments
  provider.name = args.name || provider.name;
  provider.website = args.website || provider.website || 'https://example.com';
  provider.baseUrl = args.baseUrl || provider.baseUrl;
  provider.apiKey = args.apiKey || '';
  provider.apiFormat = (args.apiFormat as 'anthropic-messages' | 'openai-completions')
    || provider.apiFormat
    || 'anthropic-messages';

  provider.models = {
    default: args.defaultModel || provider.models?.default,
    haiku: args.haikuModel || provider.models?.haiku,
    opus: args.opusModel || provider.models?.opus,
    sonnet: args.sonnetModel || provider.models?.sonnet
  };

  // Validate required fields
  if (!provider.name || !provider.baseUrl) {
    console.log(chalk.red('Error: name and baseUrl are required.'));
    console.log(chalk.yellow('Use "persona add --help" for usage information.'));
    return;
  }

  if (!provider.apiKey) {
    console.log(chalk.red('Error: apiKey is required.'));
    console.log(chalk.yellow('Use "persona add --api-key YOUR_KEY" to provide API key.'));
    return;
  }

  const newProvider: Provider = {
    id: generateProviderId(provider.name),
    name: provider.name,
    website: provider.website,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    apiFormat: provider.apiFormat,
    models: provider.models
  };

  configStore.addProvider(newProvider);

  console.log(chalk.green(`\nProvider "${newProvider.name}" added successfully!`));
  console.log(`Provider ID: ${newProvider.id}`);
}

function generateProviderId(name: string): string {
  const hash = crypto.createHash('md5').update(name).digest('hex');
  return hash.substring(0, 8);
}
