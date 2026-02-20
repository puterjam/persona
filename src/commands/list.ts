// List command - show all providers

import chalk from 'chalk';
import { configStore } from '../config/store';
import type { CliTarget } from '../types';

export function listProviders(target: string = 'claude'): void {
  const allProviders = configStore.getProviders();

  // Filter by target
  const providers = target === 'codex'
    ? allProviders.filter(p => p.target === 'codex')
    : allProviders.filter(p => !p.target || p.target === 'claude');

  const activeProvider = configStore.getActiveProvider(target as CliTarget);

  if (providers.length === 0) {
    console.log(chalk.yellow(`No ${target} providers configured. Use "persona add --target ${target}" to add a provider.`));
    return;
  }

  console.log(chalk.bold(`\n=== ${target.toUpperCase()} Providers ===\n`));

  providers.forEach((provider, index) => {
    const isActive = activeProvider?.id === provider.id;
    const activeMark = isActive ? chalk.green(' * ') : '   ';

    console.log(`${activeMark}${chalk.bold(index + 1 + '. ' + provider.name)}`);
    console.log(`      ID: ${provider.id}`);
    console.log(`      Website: ${provider.website}`);
    console.log(`      API URL: ${provider.baseUrl}`);
    console.log(`      Format: ${provider.apiFormat}`);
    if (provider.target) console.log(`      Target: ${provider.target}`);
    console.log(`      Models:`);
    if (provider.models.default) console.log(`        Default: ${provider.models.default}`);
    if (provider.models.haiku) console.log(`        Haiku: ${provider.models.haiku}`);
    if (provider.models.opus) console.log(`        Opus: ${provider.models.opus}`);
    if (provider.models.sonnet) console.log(`        Sonnet: ${provider.models.sonnet}`);
    console.log();
  });

  if (activeProvider && activeProvider.target === target) {
    console.log(chalk.green(`Active provider: ${activeProvider.name}`));
  } else {
    console.log(chalk.yellow(`No active ${target} provider selected. Use "persona use --target ${target} <id>" to select one.`));
  }
}
