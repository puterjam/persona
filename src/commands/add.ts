// Add command - add a new provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { getTemplateNames, getTemplateByFullName } from '../config/templates';
import { Provider } from '../types';
import { API_FORMAT_OPTIONS } from '../utils/constants';
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
  target?: 'claude' | 'codex';
  wireApi?: string;
  requiresOpenAiAuth?: boolean;
  envKey?: string;
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
  target?: 'claude' | 'codex';
  wireApi?: string;
  requiresOpenAiAuth?: boolean;
  envKey?: string;
}

// Step 1: Prompt for template selection (returns defaults if template selected)
export async function promptForTemplate(target: string = 'claude'): Promise<ProviderFormDefaults> {
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

  // Filter templates by target
  const templateNames = getTemplateNames();
  const filteredTemplates = templateNames.filter(name => {
    const t = getTemplateByFullName(name);
    if (target === 'codex') {
      return t && (t as any).target === 'codex';
    } else {
      return t && !(t as any).target || (t as any).target === 'claude';
    }
  });

  if (filteredTemplates.length === 0) {
    console.log(chalk.yellow(`No templates available for ${target}.`));
    return {};
  }

  const { selectedTemplate } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTemplate',
      message: 'Select a provider template:',
      choices: filteredTemplates.map(name => ({
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
      models: { ...template.defaultModels },
      target: (template as any).target,
      wireApi: (template as any).wireApi,
      requiresOpenAiAuth: (template as any).requiresOpenAiAuth,
      envKey: (template as any).envKey
    };
  }

  return {};
}

// Step 2: Prompt for provider details
export async function promptForProviderDetails(defaults: ProviderFormDefaults = {}, target: string = 'claude'): Promise<ProviderFormData> {
  const isCodex = target === 'codex';

  const questions: any[] = [
    {
      type: 'input',
      name: 'name',
      message: 'Provider name:',
      default: defaults.name,
      validate: (input: string) => input.length > 0 ? true : 'Name is required'
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
      validate: (input: string) => input.length > 0 ? true : 'Base URL is required'
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'API Key:',
      validate: (input: string) => input.length > 0 ? true : 'API Key is required'
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Default model name:',
      default: defaults.models?.default
    }
  ];

  if (isCodex) {
    questions.push({
      type: 'input',
      name: 'wireApi',
      message: 'Wire API (responses/completions/chat):',
      default: defaults.wireApi || 'responses'
    });
    questions.push({
      type: 'confirm',
      name: 'requiresOpenAiAuth',
      message: 'Requires OpenAI authentication?',
      default: defaults.requiresOpenAiAuth !== false
    });
  } else {
    questions.push({
      type: 'input',
      name: 'haikuModel',
      message: 'Haiku model name (optional):',
      default: defaults.models?.haiku
    });
    questions.push({
      type: 'input',
      name: 'opusModel',
      message: 'Opus model name (optional):',
      default: defaults.models?.opus
    });
    questions.push({
      type: 'input',
      name: 'sonnetModel',
      message: 'Sonnet model name (optional):',
      default: defaults.models?.sonnet
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    name: answers.name,
    website: answers.website,
    baseUrl: answers.baseUrl,
    apiKey: answers.apiKey,
    apiFormat: isCodex ? 'openai-completions' : 'anthropic-messages',
    models: {
      default: answers.defaultModel || undefined,
      haiku: answers.haikuModel || undefined,
      opus: answers.opusModel || undefined,
      sonnet: answers.sonnetModel || undefined
    },
    target: target as any,
    wireApi: answers.wireApi || undefined,
    requiresOpenAiAuth: answers.requiresOpenAiAuth,
    envKey: defaults.envKey || undefined
  };
}

// Step 3: Save provider
export function saveProvider(data: ProviderFormData): Provider {
  const newProvider: Provider = {
    id: generateProviderId(data.name, data.target),
    name: data.name,
    website: data.website,
    apiKey: data.apiKey,
    baseUrl: data.baseUrl,
    apiFormat: data.apiFormat,
    models: data.models,
    target: data.target,
    wireApi: data.wireApi,
    requiresOpenAiAuth: data.requiresOpenAiAuth,
    envKey: data.envKey
  };

  configStore.addProvider(newProvider);
  return newProvider;
}

// Full interactive flow (for CLI)
export async function addProviderInteractive(target: string = 'claude'): Promise<void> {
  const defaults = await promptForTemplate(target);
  const data = await promptForProviderDetails(defaults, target);
  const provider = saveProvider(data);

  console.log(chalk.green(`\nProvider "${provider.name}" added successfully!`));
  console.log(`Provider ID: ${provider.id}`);
  console.log(`Target: ${provider.target || 'claude'}`);
}

export function addProviderFromArgs(args: {
  name?: string;
  website?: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  haikuModel?: string;
  opusModel?: string;
  sonnetModel?: string;
  template?: string;
  target?: string;
}): void {
  const target = args.target || 'claude';
  let provider: Partial<Provider> = { models: {}, target: target as any };

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
      models: { ...template.defaultModels },
      target: (template as any).target || target as any
    };
  }

  // Merge command line arguments
  provider.name = args.name || provider.name;
  provider.website = args.website || provider.website || 'https://example.com';
  provider.baseUrl = args.baseUrl || provider.baseUrl;
  provider.apiKey = args.apiKey || '';
  // Set apiFormat based on target
  provider.apiFormat = target === 'codex' ? 'openai-completions' : 'anthropic-messages';

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
    id: generateProviderId(provider.name, provider.target as string),
    name: provider.name,
    website: provider.website,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    apiFormat: provider.apiFormat,
    models: provider.models,
    target: provider.target
  };

  configStore.addProvider(newProvider);

  console.log(chalk.green(`\nProvider "${newProvider.name}" added successfully!`));
  console.log(`Provider ID: ${newProvider.id}`);
}

function generateProviderId(name: string, target: string = 'claude'): string {
  const hash = crypto.createHash('md5').update(`${target}:${name}`).digest('hex');
  return hash.substring(0, 8);
}
