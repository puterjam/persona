// Configuration storage for Persona

import * as fs from 'fs';
import * as path from 'path';
import { Provider, PersonaConfig, CliTarget } from '../types';
import { getAdapter, setConfigDir } from './adapters';

const DEFAULT_CONFIG_DIR = path.join(process.env.HOME || '/root', '.persona');

export function createConfigStore(configDir?: string): ConfigStore {
  const dir = configDir || process.env.PERSONA_CONFIG_DIR || DEFAULT_CONFIG_DIR;
  setConfigDir(dir);
  return new ConfigStore(dir);
}

export class ConfigStore {
  private config: PersonaConfig;
  private configDir: string;
  private configFile: string;

  constructor(configDir?: string) {
    this.configDir = configDir || process.env.PERSONA_CONFIG_DIR || DEFAULT_CONFIG_DIR;
    this.configFile = path.join(this.configDir, 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): PersonaConfig {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    return {
      providers: [],
    };
  }

  private saveConfig(): void {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      const { activeProvider, ...cleanConfig } = this.config;
      fs.writeFileSync(this.configFile, JSON.stringify(cleanConfig, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  // Provider management
  getProviders(): Provider[] {
    return [...this.config.providers];
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
    if (this.config.activeClaudeProvider === id) {
      this.config.activeClaudeProvider = undefined;
    }
    if (this.config.activeCodexProvider === id) {
      this.config.activeCodexProvider = undefined;
    }
    this.saveConfig();
  }

  getActiveProvider(target?: CliTarget): Provider | undefined {
    const activeId = target === 'codex'
      ? this.config.activeCodexProvider
      : this.config.activeClaudeProvider;
    if (!activeId) return undefined;
    return this.getProvider(activeId);
  }

  setActiveProvider(id: string, target: CliTarget = 'claude'): void {
    if (target === 'codex') {
      this.config.activeCodexProvider = id;
    } else {
      this.config.activeClaudeProvider = id;
    }
    this.saveConfig();
  }

  clearActiveProvider(target: CliTarget = 'claude'): void {
    if (target === 'codex') {
      this.config.activeCodexProvider = undefined;
    } else {
      this.config.activeClaudeProvider = undefined;
    }
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

  // Provider configuration - delegate to Adapter
  applyProvider(provider: Provider, update: boolean = false): void {
    const target = provider.target || 'claude';
    getAdapter(target).applyProvider(provider, update);
  }

  clearProviderConfig(target: CliTarget = 'claude'): void {
    getAdapter(target).clearConfig();
    this.clearActiveProvider(target);
  }

  // General config - delegate to Adapter
  getGeneralConfig(target?: CliTarget): Record<string, any> {
    return getAdapter(target || 'claude').getGeneralConfig();
  }

  saveGeneralConfig(config: Record<string, any>, target?: CliTarget): void {
    getAdapter(target || 'claude').saveGeneralConfig(config);
  }

  getGeneralConfigPath(target?: CliTarget): string {
    return getAdapter(target || 'claude').configFile;
  }

  getGeneralConfigDir(): string {
    return path.join(this.configDir, 'general');
  }

  getConfigDir(): string {
    return this.configDir;
  }

  // Backward compatibility methods
  getClaudeSettings(): Record<string, any> {
    return getAdapter('claude').getActiveSettings();
  }

  saveClaudeSettings(settings: Record<string, any>): void {
    getAdapter('claude').saveActiveSettings(settings);
  }

  getActiveClaudeSettings(): Record<string, string> {
    const settings = getAdapter('claude').getActiveSettings();
    return settings.env || {};
  }

  applyGeneralConfigOnly(): void {
    const adapter = getAdapter('claude');
    if (adapter.applyGeneralConfigOnly) {
      adapter.applyGeneralConfigOnly();
    }
  }

  // Codex specific - for backward compatibility
  getCodexGeneralConfig(): Record<string, any> {
    return getAdapter('codex').getGeneralConfig();
  }

  getCodexGeneralConfigPath(): string {
    return getAdapter('codex').configFile;
  }

  saveCodexGeneralConfig(config: Record<string, any>): void {
    getAdapter('codex').saveGeneralConfig(config);
  }
}

// Singleton instance
export const configStore = new ConfigStore();
