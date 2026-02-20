// Configuration storage for Persona

import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import { Provider, PersonaConfig, ClaudeSettings, GeneralConfig, CliTarget } from '../types';
import { PROVIDER_ENV_KEYS } from '../utils/constants';

const CONFIG_DIR = path.join(process.env.HOME || '/root', '.persona');
const GENERAL_CONFIG_DIR = path.join(CONFIG_DIR, 'general');
const CLAUDE_GENERAL_CONFIG_FILE = path.join(GENERAL_CONFIG_DIR, 'claude.json');
const CODEX_GENERAL_CONFIG_FILE = path.join(GENERAL_CONFIG_DIR, 'codex.toml');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CLAUDE_SETTINGS_FILE = path.join(process.env.HOME || '/root', '.claude', 'settings.json');
const CODEX_DIR = path.join(process.env.HOME || '/root', '.codex');
const CODEX_CONFIG_FILE = path.join(CODEX_DIR, 'config.toml');
const CODEX_AUTH_FILE = path.join(CODEX_DIR, 'auth.json');

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
    };
  }

  private saveConfig(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      const { activeProvider, ...cleanConfig } = this.config;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleanConfig, null, 2));
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

  private buildEnvFromGeneralConfig(): { env: Record<string, string>; mergedSettings: Record<string, any> } {
    const env: Record<string, string> = {};
    const mergedSettings: Record<string, any> = {};

    const generalConfig = this.getGeneralConfig();
    for (const [key, value] of Object.entries(generalConfig)) {
      if (key === 'env' && typeof value === 'object' && value !== null) {
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

    return { env, mergedSettings };
  }

  applyProviderToClaude(provider: Provider, updateClaude: boolean = false): void {
    const settings = this.getClaudeSettings();
    const { env: baseEnv, mergedSettings } = this.buildEnvFromGeneralConfig();

    const env = { ...baseEnv };

    env['ANTHROPIC_BASE_URL'] = provider.baseUrl;
    env['ANTHROPIC_AUTH_TOKEN'] = provider.apiKey;

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

    env['ANTHROPIC_API_FORMAT'] = provider.apiFormat;

    if (provider.extraEnv) {
      for (const [key, value] of Object.entries(provider.extraEnv)) {
        env[key] = value;
      }
    }

    settings.env = env;

    for (const [key, value] of Object.entries(mergedSettings)) {
      if (key !== 'env') {
        settings[key] = value;
      }
    }

    if (updateClaude) {
      this.saveClaudeSettings(settings);
    }
  }

  private readCodexConfig(): Record<string, any> {
    try {
      if (fs.existsSync(CODEX_CONFIG_FILE)) {
        const data = fs.readFileSync(CODEX_CONFIG_FILE, 'utf-8');
        return toml.parse(data) as Record<string, any>;
      }
    } catch (error) {
      console.error('Failed to read Codex config:', error);
    }
    return {};
  }

  private writeCodexConfig(config: Record<string, any>): void {
    if (!fs.existsSync(CODEX_DIR)) {
      fs.mkdirSync(CODEX_DIR, { recursive: true });
    }
    fs.writeFileSync(CODEX_CONFIG_FILE, toml.stringify(config));
  }

  private readCodexAuth(): Record<string, string> {
    try {
      if (fs.existsSync(CODEX_AUTH_FILE)) {
        const data = fs.readFileSync(CODEX_AUTH_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to read Codex auth:', error);
    }
    return {};
  }

  private writeCodexAuth(auth: Record<string, string>): void {
    if (!fs.existsSync(CODEX_DIR)) {
      fs.mkdirSync(CODEX_DIR, { recursive: true });
    }
    fs.writeFileSync(CODEX_AUTH_FILE, JSON.stringify(auth, null, 2));
  }

  applyProviderToCodex(provider: Provider, updateCodex: boolean = false): void {
    if (!provider.apiKey) {
      console.error('Codex provider requires an API key');
      return;
    }

    const codexConfig = this.getCodexGeneralConfig();

    const model = provider.models.default || provider.models.haiku || 'gpt-4o';

    const providerConfig: Record<string, any> = {
      name: provider.name,
      wire_api: provider.wireApi || 'responses',
      base_url: provider.baseUrl
    };

    if (provider.envKey) {
      providerConfig.env_key = provider.envKey;
      providerConfig.requires_openai_auth = false;
    } else {
      providerConfig.requires_openai_auth = provider.requiresOpenAiAuth !== false;
    }

    if (updateCodex) {
      try {
        const existingConfig = this.readCodexConfig();

        if (!existingConfig.model_providers) {
          existingConfig.model_providers = {};
        }
        existingConfig.model_providers[provider.name] = providerConfig;

        if (!existingConfig.profiles) {
          existingConfig.profiles = {};
        }
        existingConfig.profiles.persona = {
          model_provider: provider.name,
          model: model,
          disable_response_storage: codexConfig.disable_response_storage !== false,
        };

        for (const [key, value] of Object.entries(codexConfig)) {
          if (key !== 'model_provider' && key !== 'model_providers' && key !== 'disable_response_storage') {
            existingConfig.profiles.persona[key] = value;
          }
        }

        this.writeCodexConfig(existingConfig);

        const authKeyName = provider.envKey || 'OPENAI_API_KEY';
        const existingAuth = this.readCodexAuth();
        existingAuth[authKeyName] = provider.apiKey;
        this.writeCodexAuth(existingAuth);
      } catch (error) {
        console.error('Failed to save Codex settings:', error);
        throw error;
      }
    }
  }

  applyProvider(provider: Provider, update: boolean = false): void {
    if (provider.target === 'codex') {
      this.applyProviderToCodex(provider, update);
    } else {
      this.applyProviderToClaude(provider, update);
    }
  }

  applyGeneralConfigOnly(): void {
    const settings = this.getClaudeSettings();
    const { env: baseEnv, mergedSettings } = this.buildEnvFromGeneralConfig();

    const env: Record<string, string> = {};
    for (const key of PROVIDER_ENV_KEYS) {
      delete baseEnv[key];
    }

    for (const [key, value] of Object.entries(baseEnv)) {
      env[key] = value;
    }

    settings.env = env;

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

  clearProviderConfig(target: CliTarget = 'claude'): void {
    if (target === 'codex') {
      try {
        const existingConfig = this.readCodexConfig();
        const profile = existingConfig.profiles?.persona;

        if (profile) {
          const providerName = profile.model_provider;
          delete existingConfig.profiles.persona;

          if (Object.keys(existingConfig.profiles).length === 0) {
            delete existingConfig.profiles;
          }

          if (providerName && existingConfig.model_providers?.[providerName]) {
            delete existingConfig.model_providers[providerName];
            if (Object.keys(existingConfig.model_providers).length === 0) {
              delete existingConfig.model_providers;
            }
          }

          this.writeCodexConfig(existingConfig);
        }
      } catch (e) { /* ignore */ }
    } else {
      const settings = this.getClaudeSettings();
      const env = settings.env || {};

      for (const key of PROVIDER_ENV_KEYS) {
        delete env[key];
      }

      settings.env = env;
      this.saveClaudeSettings(settings);
    }

    this.clearActiveProvider(target);
  }

  // General config management
  getGeneralConfig(): GeneralConfig {
    try {
      if (fs.existsSync(CLAUDE_GENERAL_CONFIG_FILE)) {
        const data = fs.readFileSync(CLAUDE_GENERAL_CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load general config:', error);
    }
    return {};
  }

  saveGeneralConfig(config: GeneralConfig): void {
    try {
      if (!fs.existsSync(GENERAL_CONFIG_DIR)) {
        fs.mkdirSync(GENERAL_CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CLAUDE_GENERAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save general config:', error);
      throw error;
    }
  }

  // Codex general config (separate file)
  getCodexGeneralConfig(): Record<string, any> {
    try {
      if (fs.existsSync(CODEX_GENERAL_CONFIG_FILE)) {
        const data = fs.readFileSync(CODEX_GENERAL_CONFIG_FILE, 'utf-8');
        return toml.parse(data);
      }
    } catch (error) {
      console.error('Failed to load Codex general config:', error);
    }
    return {};
  }

  getCodexGeneralConfigPath(): string {
    return CODEX_GENERAL_CONFIG_FILE;
  }

  saveCodexGeneralConfig(config: Record<string, any>): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CODEX_GENERAL_CONFIG_FILE, toml.stringify(config));
    } catch (error) {
      console.error('Failed to save Codex general config:', error);
      throw error;
    }
  }

  getGeneralConfigPath(): string {
    return CLAUDE_GENERAL_CONFIG_FILE;
  }

  getGeneralConfigDir(): string {
    return GENERAL_CONFIG_DIR;
  }
}

// Singleton instance
export const configStore = new ConfigStore();
