// TUI (Text User Interface) for interactive mode

import blessed from 'blessed';
import { configStore } from '../config/store';
import { testProvider } from './api';
import { getTemplateNames, getTemplateByFullName } from '../config/templates';
import { Provider } from '../types';
import { saveProvider, ProviderFormDefaults } from '../commands/add';
import * as crypto from 'crypto';

let screen: blessed.Widgets.Screen;
let providerList: any;
let detailBox: blessed.Widgets.BoxElement;
let statusBar: blessed.Widgets.BoxElement;
let header: blessed.Widgets.BoxElement;
let isInDialog = false;

// Color scheme - use terminal default colors
const colors = {
  primary: 'blue',
  text: 'default',
  textMuted: 'gray',
  bg: 'default',
  border: 'gray',
  itemHover: 'black',
  selectedBg: 'blue',
  selectedFg: 'white'
};

export function startInteractiveMode(): void {
  // Set UTF-8 locale for proper Unicode display in TUI
  // Only set if not already configured to respect user preferences
  const currentLocale = process.env.LC_ALL || process.env.LANG || '';
  if (!currentLocale.includes('UTF-8') && !currentLocale.includes('utf-8')) {
    process.env.LC_ALL = 'en_US.UTF-8';
    process.env.LANG = 'en_US.UTF-8';
  }

  // Create screen
  screen = blessed.screen({
    smartCSR: true,
    title: 'Persona - Claude CLI Provider Manager',
    dockBorders: true,
    autoPadding: true
  });

  // Header
  header = blessed.box({
    width: '100%',
    height: 3,
    top: 0,
    style: {
      bg: colors.primary,
      fg: 'white'
    }
  });

  const headerText = blessed.text({
    width: '100%',
    height: '100%',
    content: `  \x1b[1mPersona\x1b[0m - Claude CLI Provider Manager`,
    tags: true,
    style: {
      fg: 'white'
    }
  });

  header.append(headerText);

  // Provider list (left sidebar)
  providerList = blessed.list({
    width: '30%',
    height: '100%-4',
    top: 3,
    border: {
      type: 'line'
    },
    style: {
      border: { fg: colors.border },
      selected: { bg: colors.selectedBg, fg: colors.selectedFg, bold: true },
      item: { fg: colors.text }
    },
    keys: true,
    mouse: true,
    vi: false
  });

  // Detail box (right side)
  detailBox = blessed.box({
    width: '70%',
    height: '100%-4',
    left: '30%',
    top: 3,
    border: {
      type: 'line'
    },
    scrollable: true,
    style: {
      border: { fg: colors.border }
    },
    padding: { left: 2, top: 1 }
  });

  // Status bar
  statusBar = blessed.box({
    width: '100%',
    height: 1,
    bottom: 0,
    style: {
      bg: colors.primary,
      fg: 'white'
    }
  });

  const statusText = blessed.text({
    width: '100%',
    height: '100%',
    content: `  \x1b[1m↑↓\x1b[0m Navigate  \x1b[1mEnter\x1b[0m Switch  \x1b[1ma\x1b[0m Add  \x1b[1mt\x1b[0m Test  \x1b[1md\x1b[0m Delete  \x1b[1mr\x1b[0m Refresh  \x1b[1mq\x1b[0m Quit`,
    tags: true,
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

  // Auto-select first provider and show details on startup
  const providers = configStore.getProviders();
  if (providers.length > 0) {
    providerList.select(0);
    showProviderDetails(providers[0]);
  }

  // Handle list navigation - let blessed handle up/down, just update details after
  screen.key('up', () => {
    setTimeout(() => {
      const selected = (providerList as any).selected;
      const providers = configStore.getProviders();
      if (providers[selected]) {
        showProviderDetails(providers[selected]);
      }
    }, 10);
  });

  screen.key('down', () => {
    setTimeout(() => {
      const selected = (providerList as any).selected;
      const providers = configStore.getProviders();
      if (providers[selected]) {
        showProviderDetails(providers[selected]);
      }
    }, 10);
  });

  // Handle mouse click on list - use mouseup event
  screen.on('mouse', (data: any) => {
    if (data.action === 'mouseup' && data.button === 'left') {
      // Check if mouse is in list area (left 30% of screen)
      if (data.x < 30) {
        setTimeout(() => {
          const selected = (providerList as any).selected;
          const providers = configStore.getProviders();
          if (providers[selected]) {
            showProviderDetails(providers[selected]);
          }
        }, 10);
      }
    }
  });

  // Keyboard shortcuts
  screen.key('enter', () => {
    const selected = (providerList as any).selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      switchToProvider(providers[selected]);
    }
  });

  screen.key('t', async () => {
    const selected = (providerList as any).selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      await testProviderAndShowInTui(providers[selected]);
    }
  });

  screen.key('d', async () => {
    const selected = (providerList as any).selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      await deleteProviderInTui(providers[selected]);
    }
  });

  screen.key('r', () => {
    refreshProviderList();
  });

  screen.key('a', async () => {
    await startAddProviderFlow();
  });

  // Only handle ESC to exit when not in dialog mode
  // Dialogs will handle ESC themselves to return to main screen
  screen.key('escape', () => {
    if (isInDialog) {
      // In dialog mode, ESC should cancel and return to main screen
      // This will be handled by the active dialog
      return;
    }
    process.exit(0);
  });

  screen.key('q', () => {
    process.exit(0);
  });

  // Focus the provider list
  providerList.focus();
  screen.render();
}

function refreshProviderList(): void {
  const providers = configStore.getProviders();
  const activeProvider = configStore.getActiveProvider();
  const currentSelected = (providerList as any).selected;

  (providerList as any).clearItems();

  if (providers.length === 0) {
    (providerList as any).addItem('  (No providers)');
    (providerList as any).addItem('  Press a to add one');
    detailBox.setContent('No providers available. Press [a] to add a new provider.');
  } else {
    providers.forEach((p) => {
      const isActive = activeProvider?.id === p.id;
      const label = isActive ? `* ${p.name} (active)` : `  ${p.name}`;
      (providerList as any).addItem(label);
    });

    // Show details for currently selected provider (or first one if none selected)
    const selectedIndex = currentSelected !== undefined && currentSelected < providers.length ? currentSelected : 0;
    if (providers[selectedIndex]) {
      providerList.select(selectedIndex);
      showProviderDetails(providers[selectedIndex]);
    }
  }

  screen.render();
}

function showProviderDetails(provider: Provider): void {
  const activeProvider = configStore.getActiveProvider();
  const isActive = activeProvider?.id === provider.id;

  const activeBadge = isActive ? `\x1b[32m✓ Active\x1b[0m` : '';

  const content = `
${activeBadge}

\x1b[1mName:\x1b[0m     ${provider.name}
\x1b[1mWebsite:\x1b[0m  ${provider.website}
\x1b[1mAPI URL:\x1b[0m  ${provider.baseUrl}
\x1b[1mFormat:\x1b[0m   ${provider.apiFormat}

\x1b[1mModels:\x1b[0m
  Default: ${provider.models.default || '\x1b[90m(not set)\x1b[0m'}
  Haiku:   ${provider.models.haiku || '\x1b[90m(not set)\x1b[0m'}
  Opus:    ${provider.models.opus || '\x1b[90m(not set)\x1b[0m'}
  Sonnet:  ${provider.models.sonnet || '\x1b[90m(not set)\x1b[0m'}

\x1b[90mPress [Enter] to switch to this provider\x1b[0m
\x1b[90mPress [a] to add a new provider\x1b[0m
\x1b[90mPress [t] to test connection\x1b[0m
\x1b[90mPress [d] to delete\x1b[0m
\x1b[90mPress [r] to refresh\x1b[0m
\x1b[90mPress [q] to quit\x1b[0m
`;

  detailBox.setContent(content);
  screen.render();
}

function switchToProvider(provider: Provider): void {
  try {
    configStore.applyProviderToClaude(provider);
    configStore.setActiveProvider(provider.id);
    refreshProviderList();
    showProviderDetails(provider);
    detailBox.setContent(detailBox.content + `\n\n\x1b[32m✓ Switched to ${provider.name}\x1b[0m`);
  } catch (error) {
    detailBox.setContent(detailBox.content + `\n\n\x1b[31m✗ Failed to switch: ${error}\x1b[0m`);
  }
  screen.render();
}

async function testProviderAndShowInTui(provider: Provider): Promise<void> {
  const originalContent = detailBox.content;
  detailBox.setContent(originalContent + '\n\n\x1b[33mTesting connection...\x1b[0m');
  screen.render();

  const result = await testProvider(provider);

  if (result.success) {
    detailBox.setContent(originalContent + `\n\n\x1b[32m✓ Connection successful!\x1b[0m Latency: \x1b[36m${result.latency}ms\x1b[0m`);
  } else {
    detailBox.setContent(originalContent + `\n\n\x1b[31m✗ Connection failed:\x1b[0m ${result.error}`);
  }

  screen.render();
}

async function deleteProviderInTui(provider: Provider): Promise<void> {
  const originalContent = detailBox.content;
  detailBox.setContent(originalContent + '\n\n\x1b[33mPress [y] to confirm delete, any other key to cancel\x1b[0m');
  screen.render();

  const key = await new Promise<string>((resolve) => {
    const handler = (keyName: string) => {
      screen.removeKey('y', handler);
      screen.removeKey('n', handler);
      screen.removeKey('enter', handler);
      screen.removeKey('escape', handler);
      resolve(keyName);
    };
    screen.key('y', handler);
    screen.key('n', handler);
    screen.key('enter', handler);
    screen.key('escape', handler);
  });

  if (key === 'y') {
    configStore.deleteProvider(provider.id);
    refreshProviderList();
    detailBox.setContent('\x1b[32m✓ Provider deleted.\x1b[0m Select another provider.');
  } else {
    detailBox.setContent(originalContent);
  }

  screen.render();
}

// Add provider flow - separate screen overlay
async function startAddProviderFlow(): Promise<void> {
  // Mark as in dialog mode so ESC returns to main screen instead of exiting
  isInDialog = true;

  // Hide main UI
  providerList.hide();
  detailBox.hide();
  statusBar.hide();

  // Create a compact form box in the center
  const formBox = blessed.box({
    width: '60%',
    height: '70%',
    left: '20%',
    top: '15%',
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary }
    }
  });

  const title = blessed.text({
    parent: formBox,
    top: 1,
    left: 2,
    width: 'shrink',
    content: '\x1b[1mAdd New Provider\x1b[0m',
    tags: true
  });

  screen.append(formBox);
  screen.render();

  let defaults: ProviderFormDefaults = {};

  try {
    // Step 1: Use template?
    const useTemplate = await promptFormConfirm(formBox, 'Would you like to use a provider template?');
    if (useTemplate === null) {
      cleanupAddFlow(formBox);
      return;
    }

    if (useTemplate) {
      const templateNames = getTemplateNames();
      const selectedTemplate = await promptFormList(
        formBox,
        'Select a provider template:',
        templateNames.map((name: string) => {
          const t = getTemplateByFullName(name);
          return { name: `${t?.name} - ${t?.description}`, value: name };
        })
      );
      if (selectedTemplate === null) {
        cleanupAddFlow(formBox);
        return;
      }
      const template = getTemplateByFullName(selectedTemplate);
      if (template) {
        defaults = {
          name: template.name,
          website: template.website,
          baseUrl: template.baseUrl,
          apiFormat: template.apiFormat,
          models: { ...template.defaultModels }
        };
      }
    }

    // Step 2: Provider details
    const name = await promptFormInput(formBox, 'Provider name:', defaults.name, true);
    if (name === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const website = await promptFormInput(formBox, 'Website URL:', defaults.website || 'https://example.com');
    if (website === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const baseUrl = await promptFormInput(formBox, 'API Base URL:', defaults.baseUrl, true);
    if (baseUrl === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const apiKey = await promptFormInput(formBox, 'API Key:', '', true);
    if (apiKey === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const apiFormat = await promptFormList(
      formBox,
      'API Format:',
      [
        { name: 'Anthropic Messages API', value: 'anthropic-messages' },
        { name: 'OpenAI Chat Completions API', value: 'openai-completions' }
      ],
      defaults.apiFormat || 'anthropic-messages'
    );
    if (apiFormat === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const defaultModel = await promptFormInput(formBox, 'Default model name:', defaults.models?.default);
    if (defaultModel === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const haikuModel = await promptFormInput(formBox, 'Haiku model name (optional):', defaults.models?.haiku);
    if (haikuModel === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const opusModel = await promptFormInput(formBox, 'Opus model name (optional):', defaults.models?.opus);
    if (opusModel === null) {
      cleanupAddFlow(formBox);
      return;
    }

    const sonnetModel = await promptFormInput(formBox, 'Sonnet model name (optional):', defaults.models?.sonnet);
    if (sonnetModel === null) {
      cleanupAddFlow(formBox);
      return;
    }

    // Save
    const provider = saveProvider({
      name,
      website,
      baseUrl,
      apiKey,
      apiFormat: apiFormat as 'anthropic-messages' | 'openai-completions',
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined
      }
    });

    cleanupAddFlow(formBox);
    refreshProviderList();
    detailBox.setContent(`\x1b[32m✓ Provider "${provider.name}" added successfully!\x1b[0m\nProvider ID: ${provider.id}\n\nSelect a provider to view details.`);
    screen.render();
  } catch (error: any) {
    cleanupAddFlow(formBox);
    if (error.message !== 'CANCELLED') {
      detailBox.setContent(`\x1b[31m✗ Failed to add provider:\x1b[0m ${error}\n\nPress any key to continue...`);
      screen.render();
      await new Promise<void>((resolve) => {
        const handler = () => {
          screen.program.off('key', handler);
          resolve();
        };
        screen.program.on('key', handler);
      });
    }
    screen.render();
  }
}

function cleanupAddFlow(formBox: any): void {
  isInDialog = false;
  screen.remove(formBox);
  providerList.show();
  detailBox.show();
  statusBar.show();
  providerList.focus();
  screen.render();
}

// Form helpers - simpler implementation without complex state management
function promptFormInput(parent: any, message: string, defaultValue: string = '', required: boolean = false): Promise<string | null> {
  return new Promise((resolve) => {
    const container = blessed.box({
      parent,
      top: 3,
      left: 1,
      width: '98%',
      height: 5
    });

    const label = blessed.text({
      parent: container,
      top: 0,
      left: 1,
      width: '100%',
      content: message
    });

    const input = blessed.textbox({
      parent: container,
      top: 2,
      left: 1,
      width: '96%',
      height: 1,
      value: defaultValue,
      style: {
        bg: 'black',
        fg: 'white'
      },
      inputOnFocus: true
    });

    const hint = blessed.text({
      parent: container,
      top: 3,
      left: 1,
      width: '100%',
      content: 'Enter: OK  Esc: Cancel',
      style: { fg: 'gray' }
    });

    screen.render();
    input.focus();

    // Error message element (hidden by default)
    const errorMsg = blessed.text({
      parent: container,
      top: 4,
      left: 1,
      width: '100%',
      content: '',
      style: { fg: 'red', bold: true }
    });

    input.on('submit', () => {
      const value = input.getValue().trim();
      if (required && !value) {
        // Show error message and let user retry instead of hanging
        errorMsg.setContent('This field is required. Please enter a value.');
        screen.render();
        input.focus();
        return;
      }
      container.destroy();
      screen.render();
      resolve(value);
    });

    const cleanup = () => {
      container.destroy();
      screen.render();
      resolve(null);
    };

    input.on('cancel', cleanup);
    screen.key('escape', cleanup);
  });
}

function promptFormConfirm(parent: any, message: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    const container = blessed.box({
      parent,
      top: 3,
      left: 1,
      width: '98%',
      height: 5
    });

    const label = blessed.text({
      parent: container,
      top: 0,
      left: 1,
      width: '100%',
      content: message
    });

    const hint = blessed.text({
      parent: container,
      top: 2,
      left: 1,
      width: '100%',
      content: '[y] Yes    [n] No    [Esc] Cancel',
      style: { fg: 'gray' }
    });

    screen.render();

    const yesHandler = () => {
      cleanup();
      resolve(true);
    };
    const noHandler = () => {
      cleanup();
      resolve(false);
    };
    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };

    function cleanup() {
      screen.removeKey('y', yesHandler);
      screen.removeKey('n', noHandler);
      screen.removeKey('enter', yesHandler);
      screen.removeKey('escape', cancelHandler);
      container.destroy();
      screen.render();
    }

    screen.key('y', yesHandler);
    screen.key('n', noHandler);
    screen.key('enter', yesHandler);
    screen.key('escape', cancelHandler);
  });
}

function promptFormList(parent: any, message: string, choices: { name: string; value: string }[], defaultValue?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const listHeight = Math.min(choices.length + 2, 12);

    const container = blessed.box({
      parent,
      top: 3,
      left: 1,
      width: '98%',
      height: listHeight + 4
    });

    const label = blessed.text({
      parent: container,
      top: 0,
      left: 1,
      width: '100%',
      content: message
    });

    const list = blessed.list({
      parent: container,
      top: 1,
      left: 1,
      width: '96%',
      height: listHeight,
      border: { type: 'line' },
      style: {
        selected: { bg: colors.selectedBg, fg: colors.selectedFg }
      },
      keys: true,
      items: choices.map(c => c.name)
    });

    if (defaultValue) {
      const idx = choices.findIndex(c => c.value === defaultValue);
      if (idx >= 0) list.select(idx);
    }

    screen.render();
    list.focus();

    const submitHandler = () => {
      cleanup();
      resolve(choices[(list as any).selected].value);
    };

    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };

    function cleanup() {
      screen.removeKey('enter', submitHandler);
      screen.removeKey('escape', cancelHandler);
      list.removeListener('select', submitHandler);
      container.destroy();
      screen.render();
    }

    screen.key('enter', submitHandler);
    screen.key('escape', cancelHandler);
    list.on('select', submitHandler);
  });
}
