#!/usr/bin/env node

// Persona - CLI tool to switch Claude CLI configurations

import chalk from 'chalk';
import { parseArgs } from 'util';
import { listProviders } from './commands/list';
import { switchProvider, switchProviderInteractive, showStatus } from './commands/switch';
import { addProviderInteractive, addProviderFromArgs } from './commands/add';
import { editProviderInteractive, editProviderFromArgs } from './commands/edit';
import { deleteProviderInteractive, deleteProvider } from './commands/delete';
import { testProviderInteractive, testProviderById } from './commands/test';
import { startInteractiveMode } from './utils/tui';

const commands = {
  list: {
    aliases: ['ls'],
    description: 'List all configured providers',
    usage: 'persona list'
  },
  switch: {
    aliases: ['use', 'select'],
    description: 'Switch to a provider',
    usage: 'persona switch <provider-id>'
  },
  add: {
    aliases: ['create', 'new'],
    description: 'Add a new provider (interactive or with flags)',
    usage: 'persona add [--template <name>] [--name <name>] [--base-url <url>] [--api-key <key>] [--api-format <format>] [--default-model <model>] [--haiku-model <model>] [--opus-model <model>] [--sonnet-model <model>]'
  },
  edit: {
    aliases: ['update', 'modify'],
    description: 'Edit an existing provider',
    usage: 'persona edit <provider-id> [--name <name>] [--base-url <url>] [--api-key <key>] [--api-format <format>]'
  },
  delete: {
    aliases: ['remove', 'rm', 'del'],
    description: 'Delete a provider',
    usage: 'persona delete <provider-id>'
  },
  test: {
    aliases: ['ping', 'check'],
    description: 'Test provider API connection',
    usage: 'persona test [provider-id]'
  },
  interactive: {
    aliases: ['i', 'tui'],
    description: 'Start interactive TUI mode',
    usage: 'persona interactive'
  },
  status: {
    aliases: ['info', 'current'],
    description: 'Show current status',
    usage: 'persona status'
  },
  templates: {
    aliases: ['template'],
    description: 'List available provider templates',
    usage: 'persona templates'
  },
  help: {
    aliases: ['h', '?'],
    description: 'Show help information',
    usage: 'persona help [command]'
  },
  readme: {
    aliases: [],
    description: 'Show README (persona readme [en|zh])',
    usage: 'persona readme [en|zh]'
  }
};

function showHelp(command?: string): void {
  if (command && commands[command as keyof typeof commands]) {
    const cmd = commands[command as keyof typeof commands];
    console.log(chalk.bold(`\nUsage: ${cmd.usage}\n`));
    console.log(`${cmd.description}\n`);
  } else {
    console.log(chalk.bold('\nPersona - Claude CLI Provider Manager\n'));
    console.log('Usage: persona <command> [options]\n');
    console.log(chalk.bold('Commands:'));

    Object.entries(commands).forEach(([name, cmd]) => {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      console.log(`  ${name}${aliases}`);
      console.log(`    ${cmd.description}`);
    });

    console.log(chalk.bold('\nExamples:'));
    console.log('  persona list');
    console.log('  persona switch abc12345');
    console.log('  persona add --template openai --api-key sk-xxx');
    console.log('  persona test');
    console.log('  persona interactive');
    console.log();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  // Handle aliases
  const aliasMap: Record<string, string> = {
    ls: 'list',
    use: 'switch',
    select: 'switch',
    create: 'add',
    new: 'add',
    update: 'edit',
    modify: 'edit',
    remove: 'delete',
    rm: 'delete',
    del: 'delete',
    ping: 'test',
    check: 'test',
    i: 'interactive',
    tui: 'interactive',
    info: 'status',
    current: 'status',
    template: 'templates',
    h: 'help',
    '?': 'help'
  };

  const resolvedCommand = aliasMap[command] || command;

  try {
    switch (resolvedCommand) {
      case 'list': {
        listProviders();
        break;
      }

      case 'switch': {
        if (args.length < 2) {
          await switchProviderInteractive();
        } else {
          switchProvider(args[1]);
        }
        break;
      }

      case 'add': {
        // Parse additional arguments
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            template: { type: 'string' },
            name: { type: 'string' },
            'website': { type: 'string' },
            'base-url': { type: 'string' },
            'api-key': { type: 'string' },
            'api-format': { type: 'string' },
            'default-model': { type: 'string' },
            'haiku-model': { type: 'string' },
            'opus-model': { type: 'string' },
            'sonnet-model': { type: 'string' }
          },
          strict: false
        });

        if (Object.keys(parsed.values).length === 0) {
          await addProviderInteractive();
        } else {
          addProviderFromArgs({
            template: parsed.values.template as string,
            name: parsed.values.name as string,
            website: parsed.values.website as string,
            baseUrl: parsed.values['base-url'] as string,
            apiKey: parsed.values['api-key'] as string,
            apiFormat: parsed.values['api-format'] as string,
            defaultModel: parsed.values['default-model'] as string,
            haikuModel: parsed.values['haiku-model'] as string,
            opusModel: parsed.values['opus-model'] as string,
            sonnetModel: parsed.values['sonnet-model'] as string
          });
        }
        break;
      }

      case 'edit': {
        if (args.length < 2) {
          console.log(chalk.red('Error: Provider ID required.'));
          console.log(chalk.yellow(`Usage: ${commands.edit.usage}`));
          process.exit(1);
        }

        const parsed = parseArgs({
          args: args.slice(2),
          options: {
            name: { type: 'string' },
            'website': { type: 'string' },
            'base-url': { type: 'string' },
            'api-key': { type: 'string' },
            'api-format': { type: 'string' },
            'default-model': { type: 'string' },
            'haiku-model': { type: 'string' },
            'opus-model': { type: 'string' },
            'sonnet-model': { type: 'string' }
          },
          strict: false
        });

        if (Object.keys(parsed.values).length === 0) {
          await editProviderInteractive(args[1]);
        } else {
          editProviderFromArgs(args[1], {
            name: parsed.values.name as string,
            website: parsed.values.website as string,
            baseUrl: parsed.values['base-url'] as string,
            apiKey: parsed.values['api-key'] as string,
            apiFormat: parsed.values['api-format'] as string,
            defaultModel: parsed.values['default-model'] as string,
            haikuModel: parsed.values['haiku-model'] as string,
            opusModel: parsed.values['opus-model'] as string,
            sonnetModel: parsed.values['sonnet-model'] as string
          });
        }
        break;
      }

      case 'delete': {
        if (args.length < 2) {
          await deleteProviderInteractive();
        } else {
          deleteProvider(args[1]);
        }
        break;
      }

      case 'test': {
        if (args.length < 2) {
          await testProviderInteractive();
        } else {
          await testProviderById(args[1]);
        }
        break;
      }

      case 'interactive': {
        startInteractiveMode();
        break;
      }

      case 'status': {
        showStatus();
        break;
      }

      case 'templates': {
        const { getCategoryNames, getTemplatesByCategory } = await import('./config/templates');
        const categories = getCategoryNames();

        console.log(chalk.bold('\nAvailable Provider Templates:\n'));

        for (const cat of categories) {
          console.log(chalk.bold(`\n[${cat}]`));
          const templates = getTemplatesByCategory(cat);
          if (templates) {
            for (const [key, t] of Object.entries(templates)) {
              console.log(chalk.bold(`  ${t.name} (${cat}/${key})`));
              console.log(`    ${t.description}`);
              console.log(`    Base URL: ${t.baseUrl}`);
              console.log(`    API Format: ${t.apiFormat}`);
            }
          }
        }
        console.log();
        break;
      }

      case 'help': {
        showHelp(args[1]);
        break;
      }

      case 'readme': {
        const lang = args[1] || 'en';
        const fs = require('fs');
        const path = require('path');

        let readmePath;
        if (lang === 'zh' || lang === 'zh-CN') {
          readmePath = path.join(__dirname, '..', 'README.zh-CN.md');
        } else {
          readmePath = path.join(__dirname, '..', 'README.md');
        }

        try {
          if (fs.existsSync(readmePath)) {
            console.log(fs.readFileSync(readmePath, 'utf-8'));
          } else {
            console.log(chalk.red('README not found.'));
          }
        } catch (error) {
          console.log(chalk.red('Failed to read README:'), error);
        }
        break;
      }

      default: {
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.yellow(`Run "persona help" for usage information.`));
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

main();
