import * as fs from 'fs';
import * as path from 'path';
import { ProviderTemplate } from '../types';

const USER_TEMPLATES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.persona', 'templates');

function findProjectTemplatesDir(): string | null {
  const personaRoot = process.env.PERSONA_ROOT;
  if (personaRoot) {
    const p = path.join(personaRoot, 'templates');
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return null;
}

const PROJECT_TEMPLATES_DIR = findProjectTemplatesDir();

interface TemplateCategory {
  name: string;
  templates: Record<string, ProviderTemplate>;
}

function loadTemplatesFromDir(templatesDir: string): TemplateCategory[] {
  const categories: TemplateCategory[] = [];

  try {
    if (!fs.existsSync(templatesDir)) {
      return categories;
    }
    
    const dirs = fs.readdirSync(templatesDir);

    for (const dir of dirs) {
      const dirPath = path.join(templatesDir, dir);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory()) {
        const templates: Record<string, ProviderTemplate> = {};
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const templatePath = path.join(dirPath, file);
            const content = fs.readFileSync(templatePath, 'utf-8');
            const template = JSON.parse(content) as ProviderTemplate;
            const name = path.basename(file, '.json');
            templates[name] = template;
          }
        }

        if (Object.keys(templates).length > 0) {
          categories.push({ name: dir, templates });
        }
      }
    }
  } catch (error) {
    console.error('Failed to load templates from directory:', error);
  }

  return categories;
}

function mergeCategories(userCats: TemplateCategory[], projectCats: TemplateCategory[]): TemplateCategory[] {
  const merged = new Map<string, TemplateCategory>();
  
  for (const cat of projectCats) {
    merged.set(cat.name, { ...cat, templates: { ...cat.templates } });
  }
  
  for (const cat of userCats) {
    if (merged.has(cat.name)) {
      const existing = merged.get(cat.name)!;
      for (const [key, val] of Object.entries(cat.templates)) {
        existing.templates[key] = val;
      }
    } else {
      merged.set(cat.name, { ...cat, templates: { ...cat.templates } });
    }
  }
  
  return Array.from(merged.values());
}

const fallbackCategories: TemplateCategory[] = [
  {
    name: 'claude',
    templates: {
      anthropic: {
        name: 'Anthropic',
        website: 'https://www.anthropic.com',
        baseUrl: 'https://api.anthropic.com',
        apiFormat: 'anthropic-messages',
        defaultModels: {
          haiku: 'claude-3-haiku-20240307',
          opus: 'claude-opus-4-20251902',
          sonnet: 'claude-sonnet-4-20250514',
          default: 'claude-sonnet-4-20250514'
        },
        description: 'Official Anthropic API'
      }
    }
  }
];

const projectCategories = PROJECT_TEMPLATES_DIR ? loadTemplatesFromDir(PROJECT_TEMPLATES_DIR) : [];
const userCategories = loadTemplatesFromDir(USER_TEMPLATES_DIR);

export const templateCategories = mergeCategories(userCategories, projectCategories);

export function getCategoryNames(): string[] {
  return templateCategories.map(c => c.name);
}

export function getTemplatesByCategory(category: string): Record<string, ProviderTemplate> | undefined {
  const cat = templateCategories.find(c => c.name === category);
  return cat?.templates;
}

export function getAllTemplates(): Record<string, ProviderTemplate> {
  const all: Record<string, ProviderTemplate> = {};
  for (const cat of templateCategories) {
    for (const [key, val] of Object.entries(cat.templates)) {
      all[`${cat.name}/${key}`] = val;
    }
  }
  return all;
}

export function getTemplate(category: string, name: string): ProviderTemplate | undefined {
  const cat = templateCategories.find(c => c.name === category);
  return cat?.templates[name];
}

export function getTemplateByFullName(fullName: string): ProviderTemplate | undefined {
  const [category, name] = fullName.split('/');
  if (category && name) {
    return getTemplate(category, name);
  }
  return getAllTemplates()[fullName];
}

export function getTemplateNames(): string[] {
  return Object.keys(getAllTemplates());
}
