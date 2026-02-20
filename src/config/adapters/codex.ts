// Codex CLI Adapter - manages Codex-specific configuration

import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import { Provider, CliAdapter } from '../../types';

const CODEX_DIR = path.join(process.env.HOME || '/root', '.codex');
const CODEX_CONFIG_FILE = path.join(CODEX_DIR, 'config.toml');
const CODEX_AUTH_FILE = path.join(CODEX_DIR, 'auth.json');
const CODEX_GENERAL_CONFIG_FILE = path.join(
  process.env.HOME || '/root',
  '.persona',
  'general',
  'codex.toml'
);

export class CodexAdapter implements CliAdapter {
  readonly target: 'codex' = 'codex';
  readonly configFile = CODEX_GENERAL_CONFIG_FILE;
  readonly settingsFile = CODEX_CONFIG_FILE;

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

  getGeneralConfig(): Record<string, any> {
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

  saveGeneralConfig(config: Record<string, any>): void {
    try {
      const dir = path.dirname(CODEX_GENERAL_CONFIG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CODEX_GENERAL_CONFIG_FILE, toml.stringify(config));
    } catch (error) {
      console.error('Failed to save Codex general config:', error);
      throw error;
    }
  }

  getActiveSettings(): Record<string, any> {
    return this.readCodexConfig();
  }

  saveActiveSettings(settings: Record<string, any>): void {
    this.writeCodexConfig(settings);
  }

  buildEnvFromGeneralConfig(): { env: Record<string, string>; mergedSettings: Record<string, any> } {
    const generalConfig = this.getGeneralConfig();
    const env: Record<string, string> = {};
    const mergedSettings: Record<string, any> = {};

    for (const [key, value] of Object.entries(generalConfig)) {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        env[key] = String(value);
      } else if (typeof value === 'object' && value !== null) {
        mergedSettings[key] = value;
      }
    }

    return { env, mergedSettings };
  }

  applyProvider(provider: Provider, update: boolean = false): void {
    if (!provider.apiKey) {
      console.error('Codex provider requires an API key');
      return;
    }

    const codexConfig = this.getGeneralConfig();

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

    if (update) {
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

  clearConfig(): void {
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
  }
}
