import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import axios from 'axios';

const REPO = 'puterjam/persona';
const USER_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.persona');

interface SyncOptions {
  templates: boolean;
  themes: boolean;
  force: boolean;
}

async function getCategories(): Promise<string[]> {
  try {
    const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/templates`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    return (response.data as any[]).map((item: any) => item.name);
  } catch {
    return ['claude', 'codex'];
  }
}

async function getTemplateFiles(category: string): Promise<string[]> {
  try {
    const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/templates/${category}`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    return (response.data as any[]).filter((item: any) => item.name.endsWith('.json')).map((item: any) => item.name);
  } catch {
    return [];
  }
}

async function getThemeFiles(): Promise<string[]> {
  try {
    const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/themes`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    return (response.data as any[]).filter((item: any) => item.name.endsWith('.json')).map((item: any) => item.name);
  } catch {
    return [];
  }
}

async function syncTemplates(options: SyncOptions): Promise<void> {
  const templatesDir = path.join(USER_DIR, 'templates');
  fs.mkdirSync(templatesDir, { recursive: true });

  console.log(chalk.blue('Syncing templates...'));
  const categories = await getCategories();

  for (const cat of categories) {
    const catDir = path.join(templatesDir, cat);
    fs.mkdirSync(catDir, { recursive: true });

    const files = await getTemplateFiles(cat);
    for (const file of files) {
      const filePath = path.join(catDir, file);
      if (fs.existsSync(filePath) && !options.force) {
        console.log(chalk.gray(`  Skipped: ${cat}/${file} (already exists)`));
        continue;
      }

      try {
        const url = `https://raw.githubusercontent.com/${REPO}/refs/heads/dev/templates/${cat}/${file}`;
        const response = await axios.get(url, { responseType: 'text' });
        fs.writeFileSync(filePath, response.data);
        console.log(chalk.green(`  Synced: ${cat}/${file}`));
      } catch (error) {
        console.log(chalk.red(`  Failed: ${cat}/${file}`));
      }
    }
  }

  console.log(chalk.green('Templates synced successfully!'));
}

async function syncThemes(options: SyncOptions): Promise<void> {
  const themesDir = path.join(USER_DIR, 'themes');
  fs.mkdirSync(themesDir, { recursive: true });

  console.log(chalk.blue('Syncing themes...'));
  const files = await getThemeFiles();

  for (const file of files) {
    const filePath = path.join(themesDir, file);
    if (fs.existsSync(filePath) && !options.force) {
      console.log(chalk.gray(`  Skipped: ${file} (already exists)`));
      continue;
    }

    try {
      const url = `https://raw.githubusercontent.com/${REPO}/refs/heads/dev/themes/${file}`;
      const response = await axios.get(url, { responseType: 'text' });
      fs.writeFileSync(filePath, response.data);
      console.log(chalk.green(`  Synced: ${file}`));
    } catch (error) {
      console.log(chalk.red(`  Failed: ${file}`));
    }
  }

  console.log(chalk.green('Themes synced successfully!'));
}

export async function syncAssets(options: SyncOptions): Promise<void> {
  console.log(chalk.bold('\nSyncing assets from GitHub...\n'));

  if (options.themes) {
    await syncThemes(options);
    console.log();
  }

  if (options.templates) {
    await syncTemplates(options);
    console.log();
  }

  console.log(chalk.green('Sync complete!'));
}
