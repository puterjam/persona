// Add command - add a new provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { getTemplateNames, getTemplateByFullName } from '../config/templates';
import { Provider } from '../types';
import * as crypto from 'crypto';

export interface ProviderFormData {
  name: string;
  website: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: 'anthropic-messages' | 'openai-completions';
  models: {
    default?: string;
    haiku?: string;
    opus?: string;
    sonnet?: string;
  };
}

export interface ProviderFormDefaults {
  name?: string;
  website?: string;
  baseUrl?: string;
  apiFormat?: 'anthropic-messages' | 'openai-completions';
  models?: {
    default?: string;
    haiku?: string;
    opus?: string;
    sonnet?: string;
  };
}

// Step 1: Prompt for template selection (returns defaults if template selected)
export async function promptForTemplate(): Promise<ProviderFormDefaults> {
  const { useTemplate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useTemplate',
      message: 'Would you like to use a provider template?',
      default: true
    }
  ]);

  if (!useTemplate) {
    return {};
  }

  const templateNames = getTemplateNames();
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

  const template = getTemplateByFullName(selectedTemplate);
  if (template) {
    return {
      name: template.name,
      website: template.website,
      baseUrl: template.baseUrl,
      apiFormat: template.apiFormat,
      models: { ...template.defaultModels }
    };
  }

  return {};
}

// Step 2: Prompt for provider details
export async function promptForProviderDetails(defaults: ProviderFormDefaults = {}): Promise<ProviderFormData> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Provider name:',
      default: defaults.name,
      validate: (input) => input.length > 0 ? true : 'Name is required'
    },
    {
      type: 'input',
      name: 'website',
      message: 'Website URL:',
      default: defaults.website || 'https://example.com'
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'API Base URL:',
      default: defaults.baseUrl,
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
      default: defaults.apiFormat || 'anthropic-messages',
      choices: [
        { name: 'Anthropic Messages API', value: 'anthropic-messages' },
        { name: 'OpenAI Chat Completions API', value: 'openai-completions' }
      ]
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Default model name:',
      default: defaults.models?.default
    },
    {
      type: 'input',
      name: 'haikuModel',
      message: 'Haiku model name (optional):',
      default: defaults.models?.haiku
    },
    {
      type: 'input',
      name: 'opusModel',
      message: 'Opus model name (optional):',
      default: defaults.models?.opus
    },
    {
      type: 'input',
      name: 'sonnetModel',
      message: 'Sonnet model name (optional):',
      default: defaults.models?.sonnet
    }
  ]);

  return {
    name: answers.name,
    website: answers.website,
    baseUrl: answers.baseUrl,
    apiKey: answers.apiKey,
    apiFormat: answers.apiFormat,
    models: {
      default: answers.defaultModel || undefined,
      haiku: answers.haikuModel || undefined,
      opus: answers.opusModel || undefined,
      sonnet: answers.sonnetModel || undefined
    }
  };
}

// Step 3: Save provider
export function saveProvider(data: ProviderFormData): Provider {
  const newProvider: Provider = {
    id: generateProviderId(data.name),
    name: data.name,
    website: data.website,
    apiKey: data.apiKey,
    baseUrl: data.baseUrl,
    apiFormat: data.apiFormat,
    models: data.models
  };

  configStore.addProvider(newProvider);
  return newProvider;
}

// Full interactive flow (for CLI)
export async function addProviderInteractive(): Promise<void> {
  const defaults = await promptForTemplate();
  const data = await promptForProviderDetails(defaults);
  const provider = saveProvider(data);

  console.log(chalk.green(`\nProvider "${provider.name}" added successfully!`));
  console.log(`Provider ID: ${provider.id}`);
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
