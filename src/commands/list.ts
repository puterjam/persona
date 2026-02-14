// List command - show all providers

import chalk from 'chalk';
import { configStore } from '../config/store';

export function listProviders(): void {
  const providers = configStore.getProviders();
  const activeProvider = configStore.getActiveProvider();

  if (providers.length === 0) {
    console.log(chalk.yellow('No providers configured. Use "persona add" to add a provider.'));
    return;
  }

  console.log(chalk.bold('\nConfigured Providers:\n'));

  providers.forEach((provider, index) => {
    const isActive = activeProvider?.id === provider.id;
    const activeMark = isActive ? chalk.green(' * ') : '   ';

    console.log(`${activeMark}${chalk.bold(index + 1 + '. ' + provider.name)}`);
    console.log(`      ID: ${provider.id}`);
    console.log(`      Website: ${provider.website}`);
    console.log(`      API URL: ${provider.baseUrl}`);
    console.log(`      Format: ${provider.apiFormat}`);
    console.log(`      Models:`);
    if (provider.models.default) console.log(`        Default: ${provider.models.default}`);
    if (provider.models.haiku) console.log(`        Haiku: ${provider.models.haiku}`);
    if (provider.models.opus) console.log(`        Opus: ${provider.models.opus}`);
    if (provider.models.sonnet) console.log(`        Sonnet: ${provider.models.sonnet}`);
    console.log();
  });

  if (activeProvider) {
    console.log(chalk.green(`Active provider: ${activeProvider.name}`));
  } else {
    console.log(chalk.yellow('No active provider selected. Use "persona switch <id>" to select one.'));
  }
}
