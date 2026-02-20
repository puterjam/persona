#!/usr/bin/env bun

process.env.LC_ALL = 'en_US.UTF-8';
process.env.LANG = 'en_US.UTF-8';

import chalk from 'chalk';
import { parseArgs } from 'util';
import { listProviders } from './commands/list';
import { switchProvider, switchProviderInteractive, showStatus } from './commands/switch';
import { addProviderInteractive, addProviderFromArgs } from './commands/add';
import { editProviderInteractive, editProviderFromArgs } from './commands/edit';
import { deleteProviderInteractive, deleteProvider } from './commands/delete';
import { testProviderInteractive, testProviderById } from './commands/test';
import { editGeneralConfig, showGeneralConfig } from './commands/config';
import { showTheme, listThemes, setTheme } from './commands/theme';
import { showEnvConfig, editEnvConfig } from './commands/env';
import { syncAssets } from './commands/sync';
import { startInteractiveMode } from './tui';
import { aliasMap, commands } from './cli/commands';
import { showHelp } from './cli/help';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await startInteractiveMode();
    return;
  }

  const command = args[0];
  const resolvedCommand = aliasMap[command] || command;

  try {
    switch (resolvedCommand) {
      case 'list': {
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            target: { type: 'string', short: 't', default: 'claude' }
          },
          strict: false
        });
        listProviders(parsed.values.target as string);
        break;
      }

      case 'use': {
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            update: { type: 'boolean', short: 'u', default: false },
            target: { type: 'string', short: 't', default: 'claude' }
          },
          strict: false
        });

        const remainingArgs = parsed.positionals;
        const shouldUpdate = parsed.values.update === true;
        const target = parsed.values.target as string;

        if (remainingArgs.length < 1 && !shouldUpdate) {
          await switchProviderInteractive(target);
        } else if (shouldUpdate) {
          const { updateClaudeConfig } = await import('./commands/switch');
          updateClaudeConfig();
        } else {
          switchProvider(remainingArgs[0], true, target as any);
        }
        break;
      }

      case 'add': {
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            template: { type: 'string' },
            name: { type: 'string' },
            'website': { type: 'string' },
            'base-url': { type: 'string' },
            'api-key': { type: 'string' },
            'default-model': { type: 'string' },
            'haiku-model': { type: 'string' },
            'opus-model': { type: 'string' },
            'sonnet-model': { type: 'string' },
            'target': { type: 'string', short: 't', default: 'claude' }
          },
          strict: false
        });

        if (Object.keys(parsed.positionals).length === 0 && Object.keys(parsed.values).length <= 1) {
          await addProviderInteractive(parsed.values.target as string);
        } else {
          addProviderFromArgs({
            template: parsed.values.template as string,
            name: parsed.values.name as string,
            website: parsed.values.website as string,
            baseUrl: parsed.values['base-url'] as string,
            apiKey: parsed.values['api-key'] as string,
            defaultModel: parsed.values['default-model'] as string,
            haikuModel: parsed.values['haiku-model'] as string,
            opusModel: parsed.values['opus-model'] as string,
            sonnetModel: parsed.values['sonnet-model'] as string,
            target: parsed.values.target as string
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
            defaultModel: parsed.values['default-model'] as string,
            haikuModel: parsed.values['haiku-model'] as string,
            opusModel: parsed.values['opus-model'] as string,
            sonnetModel: parsed.values['sonnet-model'] as string
          });
        }
        break;
      }

      case 'remove': {
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            target: { type: 'string', short: 't', default: 'claude' }
          },
          strict: false
        });

        const remainingArgs = parsed.positionals;

        if (remainingArgs.length < 1) {
          await deleteProviderInteractive(undefined, parsed.values.target as string);
        } else {
          deleteProvider(remainingArgs[0]);
        }
        break;
      }

      case 'ping': {
        if (args.length < 2) {
          await testProviderInteractive();
        } else {
          await testProviderById(args[1]);
        }
        break;
      }

      case 'interactive': {
        await startInteractiveMode();
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

      case 'theme': {
        const themeCommand = args[1];
        if (themeCommand === 'list') {
          listThemes();
        } else if (themeCommand) {
          setTheme(themeCommand);
        } else {
          showTheme();
        }
        break;
      }

      case 'env': {
        const subCommand = args[1];
        if (subCommand === 'edit') {
          editEnvConfig(args.slice(2));
        } else if (subCommand === 'show' || !subCommand) {
          showEnvConfig();
        } else {
          console.log(chalk.red(`Unknown env subcommand: ${subCommand}`));
          console.log(chalk.yellow('Usage: persona env [edit] [claude|codex]'));
          process.exit(1);
        }
        break;
      }

      case 'sync': {
        const parsed = parseArgs({
          args: args.slice(1),
          options: {
            templates: { type: 'boolean', default: false },
            themes: { type: 'boolean', default: false },
            all: { type: 'boolean', default: false },
            force: { type: 'boolean', short: 'f', default: false }
          },
          strict: false
        });

        const templates = parsed.values.templates as boolean;
        const themes = parsed.values.themes as boolean;
        const all = parsed.values.all as boolean;

        await syncAssets({
          templates: all || templates || (!themes && !templates),
          themes: all || themes || (!themes && !templates),
          force: parsed.values.force as boolean
        });
        break;
      }

      case 'help': {
        showHelp(args[1]);
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
