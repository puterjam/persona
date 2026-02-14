// TUI (Text User Interface) for interactive mode

import blessed from 'blessed';
import { configStore } from '../config/store';
import { testProvider } from './api';
import { Provider } from '../types';

let screen: blessed.Widgets.Screen;
let providerList: any;
let detailBox: blessed.Widgets.BoxElement;
let statusBar: blessed.Widgets.BoxElement;

export function startInteractiveMode(): void {
  // Create screen
  screen = blessed.screen({
    smartCSR: true,
    title: 'Persona - Claude CLI Provider Manager'
  });

  // Create main container
  const container = blessed.box({
    width: '100%',
    height: '100%',
    layout: 'grid',
    grid: [[0, 30, 100], [30, 100]],
    style: {
      bg: 'black'
    }
  });

  // Header
  const header = blessed.box({
    width: '100%',
    height: 3,
    top: 0,
    style: {
      bg: 'blue',
      bold: true
    }
  });

  const headerText = blessed.text({
    width: '100%',
    height: '100%',
    content: '  Persona - Claude CLI Provider Manager',
    style: {
      bold: true,
      fg: 'white'
    }
  });

  header.append(headerText);

  // Provider list (left sidebar)
  providerList = blessed.list({
    width: '30%',
    height: '100%',
    top: 3,
    border: {
      type: 'line'
    },
    style: {
      selected: {
        bg: 'blue',
        bold: true
      }
    },
    keys: true,
    mouse: true
  });

  // Detail box (right side)
  detailBox = blessed.box({
    width: '70%',
    height: '100%',
    left: '30%',
    top: 3,
    border: {
      type: 'line'
    },
    scrollable: true,
    content: 'Select a provider to view details'
  });

  // Status bar
  statusBar = blessed.box({
    width: '100%',
    height: 1,
    bottom: 0,
    style: {
      bg: 'blue'
    }
  });

  const statusText = blessed.text({
    width: '100%',
    height: '100%',
    content: '  ↑↓: Navigate | Enter: Switch | t: Test | d: Delete | q: Quit',
    style: {
      fg: 'white'
    }
  });

  statusBar.append(statusText);

  // Add elements to screen
  screen.append(header);
  screen.append(providerList);
  screen.append(detailBox);
  screen.append(statusBar);

  // Load providers
  refreshProviderList();

  // Event handlers
  providerList.on('select', (item: any, index: number) => {
    const providers = configStore.getProviders();
    if (providers[index]) {
      showProviderDetails(providers[index]);
    }
  });

  providerList.on('action', (item: any, index: number) => {
    const providers = configStore.getProviders();
    if (providers[index]) {
      switchToProvider(providers[index]);
    }
  });

  // Keyboard shortcuts
  screen.key('enter', () => {
    const selected = providerList.selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      switchToProvider(providers[selected]);
    }
  });

  screen.key('t', async () => {
    const selected = providerList.selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      await testProviderAndShowInTui(providers[selected]);
    }
  });

  screen.key('d', async () => {
    const selected = providerList.selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      await deleteProviderInTui(providers[selected]);
    }
  });

  screen.key('r', () => {
    refreshProviderList();
  });

  screen.key('q', () => {
    process.exit(0);
  });

  screen.key('escape', () => {
    process.exit(0);
  });

  screen.render();
}

function refreshProviderList(): void {
  const providers = configStore.getProviders();
  const activeProvider = configStore.getActiveProvider();

  providerList.clearItems();

  providers.forEach((p, index) => {
    const isActive = activeProvider?.id === p.id;
    const label = isActive ? `* ${p.name}` : p.name;
    providerList.addItem(label);
  });

  if (providers.length === 0) {
    providerList.addItem('(No providers)');
  }

  screen.render();
}

function showProviderDetails(provider: Provider): void {
  const activeProvider = configStore.getActiveProvider();
  const isActive = activeProvider?.id === provider.id;

  let content = `
${isActive ? '✓ Active Provider' : ''}

 Name:     ${provider.name}
 Website:  ${provider.website}
 API URL:  ${provider.baseUrl}
 Format:   ${provider.apiFormat}

 Models:
   Default: ${provider.models.default || '(not set)'}
   Haiku:   ${provider.models.haiku || '(not set)'}
   Opus:    ${provider.models.opus || '(not set)'}
   Sonnet:  ${provider.models.sonnet || '(not set)'}

Press [Enter] to switch to this provider
Press [t] to test connection
Press [d] to delete
Press [r] to refresh
Press [q] to quit
`;

  detailBox.setContent(content);
  screen.render();
}

function switchToProvider(provider: Provider): void {
  try {
    configStore.applyProviderToClaude(provider);
    configStore.setActiveProvider(provider.id);
    showProviderDetails(provider);
    refreshProviderList();
    detailBox.setContent(detailBox.content + '\n' + '✓ Switched to ' + provider.name);
  } catch (error) {
    detailBox.setContent(detailBox.content + '\n' + '✗ Failed to switch: ' + error);
  }
  screen.render();
}

async function testProviderAndShowInTui(provider: Provider): Promise<void> {
  const originalContent = detailBox.content;
  detailBox.setContent(originalContent + '\n\nTesting connection...');
  screen.render();

  const result = await testProvider(provider);

  if (result.success) {
    detailBox.setContent(originalContent + `\n\n✓ Connection successful! Latency: ${result.latency}ms`);
  } else {
    detailBox.setContent(originalContent + `\n\n✗ Connection failed: ${result.error}`);
  }

  screen.render();
}

async function deleteProviderInTui(provider: Provider): Promise<void> {
  // Simple confirmation with key press
  const originalContent = detailBox.content;
  detailBox.setContent(originalContent + '\n\nPress [y] to confirm delete, any other key to cancel');
  screen.render();

  // Wait for key press
  const key = await new Promise<string>((resolve) => {
    const handler = (key: any) => {
      screen.program.off('key', handler);
      resolve(key.full);
    };
    screen.program.on('key', handler);
  });

  if (key === 'y') {
    configStore.deleteProvider(provider.id);
    refreshProviderList();
    detailBox.setContent('Provider deleted. Select another provider.');
  } else {
    detailBox.setContent(originalContent);
  }

  screen.render();
}
