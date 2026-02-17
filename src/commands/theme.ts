import chalk from 'chalk';
import { configStore } from '../config/store';
import { getThemeNames, loadTheme } from '../utils/theme';

export function listThemes(): void {
  const currentTheme = configStore.getTheme();
  const themeNames = getThemeNames();

  console.log(chalk.bold('\nAvailable Themes:\n'));
  
  for (const name of themeNames) {
    const marker = name === currentTheme ? chalk.green(' ✓') : '';
    console.log(`  ${name}${marker}`);
  }
  console.log();
}

export function showTheme(): void {
  const currentTheme = configStore.getTheme();
  console.log(chalk.bold('\nCurrent Theme: ') + chalk.cyan(currentTheme) + '\n');
}

export function setTheme(themeName: string): void {
  const themeNames = getThemeNames();
  
  if (!themeNames.includes(themeName)) {
    console.log(chalk.red(`Theme "${themeName}" not found.`));
    console.log(chalk.yellow(`Available themes: ${themeNames.join(', ')}`));
    return;
  }

  const colors = loadTheme(themeName);
  if (!colors) {
    console.log(chalk.red(`Failed to load theme "${themeName}".`));
    return;
  }

  configStore.setTheme(themeName);
  console.log(chalk.green(`\nTheme "${themeName}" applied successfully!\n`));
}
