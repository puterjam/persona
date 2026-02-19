import * as fs from 'fs';
import * as path from 'path';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  text: string;
  textMuted: string;
  textHighlight: string;
  bg: string;
  bgLight: string;
  border: string;
  selected: string;
  selectedText: string;
  success: string;
  error: string;
  warning: string;
  overlay: string;
  dialogText: string;
}

export interface ThemeConfig {
  name: string;
  description: string;
  type: 'dark' | 'light';
  colors: ThemeColors;
}

export const defaultTheme = {
  colors: {
    primary: "#0b0b0b",
    primaryLight: "#488ee4",
    text: "#e2e8f0",
    textMuted: "#797979",
    textHighlight: "#ffffff", 
    bg: "#0b0b0b",
    bgLight: "#141414",
    border: "#484848",
    selected: "#3b82f6",
    selectedText: "#ffffff",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    overlay: "#000000cc",
    dialogText: "#ffffff",
  },
  
  fonts: {
    header: "tiny",
  },

  layout: {
    statusBarHeight: 3,
    headerHeight: 5,
    consoleHeightPercent: 20,
    dialogMinWidth: 50,
    dialogMaxWidth: 60,
  }
} as const;

export const layout = defaultTheme.layout;

let currentTheme: ThemeColors = defaultTheme.colors;

const USER_THEMES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.persona', 'themes');

function findProjectThemesDir(): string | null {
  const personaRoot = process.env.PERSONA_ROOT;
  if (personaRoot) {
    const p = path.join(personaRoot, 'themes');
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return null;
}

const PROJECT_THEMES_DIR = findProjectThemesDir();

const builtInThemes: Record<string, ThemeConfig> = {
  persona: {
    name: "Persona",
    description: "Default dark theme",
    type: "dark",
    colors: defaultTheme.colors
  }
};

export function getThemeColors(): ThemeColors {
  return currentTheme;
}

export function setThemeColors(colors: ThemeColors): void {
  currentTheme = colors;
}

export function getThemeNames(): string[] {
  const names = new Set<string>();
  
  try {
    if (fs.existsSync(USER_THEMES_DIR)) {
      const files = fs.readdirSync(USER_THEMES_DIR);
      files.filter(f => f.endsWith('.json')).forEach(f => names.add(f.replace('.json', '')));
    }
  } catch {}
  
  try {
    if (PROJECT_THEMES_DIR && fs.existsSync(PROJECT_THEMES_DIR)) {
      const files = fs.readdirSync(PROJECT_THEMES_DIR);
      files.filter(f => f.endsWith('.json')).forEach(f => names.add(f.replace('.json', '')));
    }
  } catch {}
  
  if (names.size === 0) {
    console.log('  Using built-in:', Object.keys(builtInThemes));
    return Object.keys(builtInThemes);
  }
  
  return Array.from(names).sort();
}

function findThemePath(name: string): string | null {
  const userPath = path.join(USER_THEMES_DIR, `${name}.json`);
  if (fs.existsSync(userPath)) {
    return userPath;
  }
  
  if (PROJECT_THEMES_DIR) {
    const projectPath = path.join(PROJECT_THEMES_DIR, `${name}.json`);
    if (fs.existsSync(projectPath)) {
      return projectPath;
    }
  }
  
  return null;
}

export function loadTheme(name: string): ThemeColors | null {
  const themePath = findThemePath(name);
  
  if (themePath) {
    try {
      const content = fs.readFileSync(themePath, 'utf-8');
      const config: ThemeConfig = JSON.parse(content);
      setThemeColors(config.colors);
      return config.colors;
    } catch (error) {
      console.error(`Failed to load theme "${name}":`, error);
    }
  }
  
  if (builtInThemes[name]) {
    setThemeColors(builtInThemes[name].colors);
    return builtInThemes[name].colors;
  }
  
  console.error(`Theme "${name}" not found`);
  return null;
}

export function loadThemeFromConfig(): void {
  const CONFIG_DIR = path.join(process.env.HOME || '/root', '.persona');
  const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
  
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      
      if (config.theme && config.theme !== 'persona') {
        loadTheme(config.theme);
      }
    }
  } catch {
    // Use default theme on error
  }
}

export const theme = {
  colors: currentTheme,
  fonts: defaultTheme.fonts,
  layout: defaultTheme.layout,
};

export type Theme = typeof defaultTheme;
