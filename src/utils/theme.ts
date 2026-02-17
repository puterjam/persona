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

const THEMES_DIR = path.join(__dirname, '../../themes');

export function getThemeColors(): ThemeColors {
  return currentTheme;
}

export function setThemeColors(colors: ThemeColors): void {
  currentTheme = colors;
}

export function getThemeNames(): string[] {
  try {
    if (!fs.existsSync(THEMES_DIR)) {
      return ['persona'];
    }
    const files = fs.readdirSync(THEMES_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch {
    return ['persona'];
  }
}

export function loadTheme(name: string): ThemeColors | null {
  const themePath = path.join(THEMES_DIR, `${name}.json`);
  
  try {
    if (!fs.existsSync(themePath)) {
      console.error(`Theme "${name}" not found`);
      return null;
    }
    
    const content = fs.readFileSync(themePath, 'utf-8');
    const config: ThemeConfig = JSON.parse(content);
    
    setThemeColors(config.colors);
    return config.colors;
  } catch (error) {
    console.error(`Failed to load theme "${name}":`, error);
    return null;
  }
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
