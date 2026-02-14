// Delete command - delete a provider

import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../config/store';

export async function deleteProviderInteractive(providerId?: string): Promise<void> {
  let targetId = providerId;

  // If no ID provided, show list to select
  if (!targetId) {
    const providers = configStore.getProviders();

    if (providers.length === 0) {
      console.log(chalk.yellow('No providers to delete.'));
      return;
    }

    const { selectedId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Select a provider to delete:',
        choices: providers.map(p => ({
          name: p.name,
          value: p.id
        }))
      }
    ]);

    targetId = selectedId;
  }

  const provider = configStore.getProvider(targetId!);

  if (!provider) {
    console.log(chalk.red(`Provider "${targetId}" not found.`));
    return;
  }

  // Confirm deletion
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete provider "${provider.name}"?`,
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Deletion cancelled.'));
    return;
  }

  configStore.deleteProvider(targetId!);
  console.log(chalk.green(`\nProvider "${provider.name}" deleted successfully!`));
}

export function deleteProvider(providerId: string): void {
  const provider = configStore.getProvider(providerId);

  if (!provider) {
    console.log(chalk.red(`Provider "${providerId}" not found.`));
    console.log(chalk.yellow('Use "persona list" to see available providers.'));
    return;
  }

  configStore.deleteProvider(providerId);
  console.log(chalk.green(`\nProvider "${provider.name}" deleted successfully!`));
}
