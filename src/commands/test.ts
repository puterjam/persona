// Test command - test provider API connection

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { testProvider } from '../utils/api';
import { Provider } from '../types';

export async function testProviderInteractive(): Promise<void> {
  const providers = configStore.getProviders();

  if (providers.length === 0) {
    console.log(chalk.yellow('No providers to test. Add a provider first.'));
    return;
  }

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: 'Select a provider to test:',
      choices: providers.map(p => ({
        name: p.name,
        value: p.id
      }))
    }
  ]);

  const provider = configStore.getProvider(selectedId);
  if (provider) {
    await testProviderAndShowResult(provider);
  }
}

export async function testProviderById(providerId: string): Promise<void> {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  await testProviderAndShowResult(provider);
}

async function testProviderAndShowResult(provider: Provider): Promise<void> {
  console.log(chalk.bold(`\nTesting provider: ${provider.name}\n`));
  console.log(`API URL: ${provider.baseUrl}`);
  console.log(`Model: ${provider.models.default || provider.models.haiku || 'N/A'}`);
  console.log('Testing connection...\n');

  const result = await testProvider(provider);

  if (result.success) {
    console.log(chalk.green('✓ Connection successful!'));
    console.log(`  Latency: ${result.latency}ms`);
    console.log(`  Model: ${result.model}`);
    
    if (result.timingBreakdown) {
      console.log(chalk.bold('\n  Timing Breakdown:'));
      const { dns, connect, ttfb, api } = result.timingBreakdown;
      if (dns !== undefined) console.log(`    DNS: ${dns}ms`);
      if (connect !== undefined) console.log(`    Connect: ${connect}ms`);
      if (ttfb !== undefined) console.log(`    TTFB: ${ttfb}ms`);
      if (api !== undefined) console.log(`    API: ${api}ms`);
    }
  } else {
    console.log(chalk.red('✗ Connection failed!'));
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log();
}
