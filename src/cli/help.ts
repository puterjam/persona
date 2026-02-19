import chalk from 'chalk'
import { commands, CommandDefinition } from './commands'

export function showHelp(command?: string): void {
  if (command && commands[command as keyof typeof commands]) {
    const cmd = commands[command as keyof typeof commands];
    console.log(chalk.bold(`\nUsage: ${cmd.usage}\n`));
    console.log(`${cmd.description}\n`);
  } else {
    console.log(chalk.bold('\nPersona - AI Coding CLI Provider Manager\n'));
    console.log('Usage: persona <command> [options]\n');
    console.log(chalk.bold('Commands:'));

    Object.entries(commands).forEach(([name, cmd]) => {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      console.log(`  ${name}${aliases}`);
      console.log(`    ${cmd.description}`);
    });

    console.log(chalk.bold('\nExamples:'));
    console.log('  persona list');
    console.log('  persona use abc12345');
    console.log('  persona add --template openai --api-key sk-xxx');
    console.log('  persona ping');
    console.log();
  }
}
