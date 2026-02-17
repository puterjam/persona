// Configuration storage for Persona

import * as fs from 'fs';
import * as path from 'path';
import { Provider, PersonaConfig, ClaudeSettings, GeneralConfig } from '../types';
import { PROVIDER_ENV_KEYS } from '../utils/constants';

const CONFIG_DIR = path.join(process.env.HOME || '/root', '.persona');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const GENERAL_CONFIG_FILE = path.join(CONFIG_DIR, 'general.json');
const CLAUDE_SETTINGS_FILE = path.join(process.env.HOME || '/root', '.claude', 'settings.json');

export class ConfigStore {
  private config: PersonaConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): PersonaConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    return {
      providers: [],
      activeProvider: ''
    };
  }

  private saveConfig(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  // Provider management
  getProviders(): Provider[] {
    return this.config.providers;
  }

  getProvider(id: string): Provider | undefined {
    return this.config.providers.find(p => p.id === id);
  }

  addProvider(provider: Provider): void {
    this.config.providers.push(provider);
    this.saveConfig();
  }

  updateProvider(id: string, updates: Partial<Provider>): void {
    const index = this.config.providers.findIndex(p => p.id === id);
    if (index !== -1) {
      this.config.providers[index] = { ...this.config.providers[index], ...updates };
      this.saveConfig();
    }
  }

  deleteProvider(id: string): void {
    this.config.providers = this.config.providers.filter(p => p.id !== id);
    if (this.config.activeProvider === id) {
      this.config.activeProvider = '';
    }
    this.saveConfig();
  }

  getActiveProvider(): Provider | undefined {
    if (!this.config.activeProvider) return undefined;
    return this.getProvider(this.config.activeProvider);
  }

  setActiveProvider(id: string): void {
    this.config.activeProvider = id;
    this.saveConfig();
  }

  // Theme management
  getTheme(): string {
    return this.config.theme || 'persona';
  }

  setTheme(themeName: string): void {
    this.config.theme = themeName;
    this.saveConfig();
  }

  // Claude settings management
  getClaudeSettings(): ClaudeSettings {
    try {
      if (fs.existsSync(CLAUDE_SETTINGS_FILE)) {
        const data = fs.readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load Claude settings:', error);
    }
    return { env: {} };
  }

  saveClaudeSettings(settings: ClaudeSettings): void {
    try {
      fs.writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save Claude settings:', error);
      throw error;
    }
  }

  applyProviderToClaude(provider: Provider, updateClaude: boolean = false): void {
    const settings = this.getClaudeSettings();
    const env: Record<string, string> = {};
    const mergedSettings: any = {};

    // Apply general config first (lower priority)
    // - Nested objects (like statusLine) go to root level
    // - Flat key-values go to env
    // - Special case: "env" object should be flattened into settings.env
    const generalConfig = this.getGeneralConfig();
    for (const [key, value] of Object.entries(generalConfig)) {
      if (key === 'env' && typeof value === 'object' && value !== null) {
        // Special case: merge env object into settings.env
        for (const [envKey, envValue] of Object.entries(value)) {
          if (typeof envValue === 'string') {
            env[envKey] = envValue;
          } else if (typeof envValue === 'number' || typeof envValue === 'boolean') {
            env[envKey] = String(envValue);
          }
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - keep at root level
        mergedSettings[key] = value;
      } else if (typeof value === 'string') {
        env[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        env[key] = String(value);
      }
    }

    // Apply provider config (higher priority, can override general)
    // Set base URL
    env['ANTHROPIC_BASE_URL'] = provider.baseUrl;

    // Set API token
    env['ANTHROPIC_AUTH_TOKEN'] = provider.apiKey;

    // Set models
    if (provider.models.haiku) {
      env['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = provider.models.haiku;
    }
    if (provider.models.opus) {
      env['ANTHROPIC_DEFAULT_OPUS_MODEL'] = provider.models.opus;
    }
    if (provider.models.sonnet) {
      env['ANTHROPIC_DEFAULT_SONNET_MODEL'] = provider.models.sonnet;
    }
    if (provider.models.default) {
      env['ANTHROPIC_MODEL'] = provider.models.default;
    }

    // Set API format hint via custom env var
    env['ANTHROPIC_API_FORMAT'] = provider.apiFormat;

    // Set extra environment variables from provider
    if (provider.extraEnv) {
      for (const [key, value] of Object.entries(provider.extraEnv)) {
        env[key] = value;
      }
    }

    settings.env = env;

    // Merge nested objects (like statusLine) into settings
    for (const [key, value] of Object.entries(mergedSettings)) {
      if (key !== 'env') {
        settings[key] = value;
      }
    }

    if (updateClaude) {
      this.saveClaudeSettings(settings);
    }
  }

  applyGeneralConfigOnly(): void {
    const settings = this.getClaudeSettings();
    const env: Record<string, string> = {};
    const mergedSettings: any = {};

    // Only apply general config, clear provider-specific keys
    for (const key of PROVIDER_ENV_KEYS) {
      delete env[key];
    }

    // Apply general config - nested objects go to root, flat values go to env
    // Special case: "env" object should be flattened into settings.env
    const generalConfig = this.getGeneralConfig();
    for (const [key, value] of Object.entries(generalConfig)) {
      if (key === 'env' && typeof value === 'object' && value !== null) {
        // Special case: merge env object into settings.env
        for (const [envKey, envValue] of Object.entries(value)) {
          if (typeof envValue === 'string') {
            env[envKey] = envValue;
          } else if (typeof envValue === 'number' || typeof envValue === 'boolean') {
            env[envKey] = String(envValue);
          }
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        mergedSettings[key] = value;
      } else if (typeof value === 'string') {
        env[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        env[key] = String(value);
      }
    }

    settings.env = env;

    // Merge nested objects
    for (const [key, value] of Object.entries(mergedSettings)) {
      if (key !== 'env') {
        settings[key] = value;
      }
    }

    this.saveClaudeSettings(settings);
  }

  getActiveClaudeSettings(): Record<string, string> {
    const settings = this.getClaudeSettings();
    return settings.env || {};
  }

  clearProviderConfig(): void {
    const settings = this.getClaudeSettings();
    const env = settings.env || {};

    // Remove persona-related keys
    for (const key of PROVIDER_ENV_KEYS) {
      delete env[key];
    }

    settings.env = env;
    this.saveClaudeSettings(settings);

    // Clear active provider
    this.config.activeProvider = '';
    this.saveConfig();
  }

  // General config management
  getGeneralConfig(): GeneralConfig {
    try {
      if (fs.existsSync(GENERAL_CONFIG_FILE)) {
        const data = fs.readFileSync(GENERAL_CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load general config:', error);
    }
    return {};
  }

  saveGeneralConfig(config: GeneralConfig): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(GENERAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save general config:', error);
      throw error;
    }
  }

  getGeneralConfigPath(): string {
    return GENERAL_CONFIG_FILE;
  }
}

// Singleton instance
export const configStore = new ConfigStore();
