import inquirer from 'inquirer';
import { configStore } from '../config/store';
import { Provider } from '../types';

export async function promptSelectProvider(
  message: string = 'Select a provider:'
): Promise<Provider | null> {
  const providers = configStore.getProviders();

  if (providers.length === 0) {
    return null;
  }

  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message,
      choices: providers.map(p => ({
        name: p.name,
        value: p.id
      }))
    }
  ]);

  return configStore.getProvider(selectedId) || null;
}

export function getProviderOrPrompt(providerId?: string): Provider | null {
  if (providerId) {
    return configStore.getProvider(providerId) || null;
  }
  return null;
}
