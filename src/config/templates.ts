// Load provider templates from templates directory

import * as fs from 'fs';
import * as path from 'path';
import { ProviderTemplate } from '../types';

// Try to load templates from templates directory
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

interface TemplateCategory {
  name: string;
  templates: Record<string, ProviderTemplate>;
}

function loadTemplatesFromDir(): TemplateCategory[] {
  const categories: TemplateCategory[] = [];

  try {
    if (fs.existsSync(TEMPLATES_DIR)) {
      const dirs = fs.readdirSync(TEMPLATES_DIR);

      for (const dir of dirs) {
        const dirPath = path.join(TEMPLATES_DIR, dir);
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
    }
  } catch (error) {
    console.error('Failed to load templates from directory:', error);
  }

  return categories;
}

// Load templates from directory
const loadedCategories = loadTemplatesFromDir();

// Fallback templates (in case templates directory is not available)
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
      },
      minimax: {
        name: 'MiniMax',
        website: 'https://www.minimaxi.com',
        baseUrl: 'https://api.minimax.chat/v1',
        apiFormat: 'anthropic-messages',
        defaultModels: {
          haiku: 'MiniMax-M2.5',
          opus: 'MiniMax-M2.5',
          sonnet: 'MiniMax-M2.5',
          default: 'MiniMax-M2.5'
        },
        description: 'MiniMax AI API'
      }
    }
  }
];

// Use loaded categories, fallback to hardcoded if empty
export const templateCategories = loadedCategories.length > 0 ? loadedCategories : fallbackCategories;

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
  // Try to find in any category
  return getAllTemplates()[fullName];
}

export function getTemplateNames(): string[] {
  return Object.keys(getAllTemplates());
}
