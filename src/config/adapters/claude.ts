// Claude CLI Adapter - manages Claude-specific configuration

import * as fs from 'fs';
import * as path from 'path';
import { Provider, CliAdapter, ClaudeSettings } from '../../types';
import { PROVIDER_ENV_KEYS } from '../../utils/constants';

const CLAUDE_SETTINGS_FILE = path.join(
  process.env.HOME || '/root',
  '.claude',
  'settings.json'
);

const CLAUDE_GENERAL_CONFIG_FILE = path.join(
  process.env.HOME || '/root',
  '.persona',
  'general',
  'claude.json'
);

export class ClaudeAdapter implements CliAdapter {
  readonly target: 'claude' = 'claude';
  readonly configFile = CLAUDE_GENERAL_CONFIG_FILE;
  readonly settingsFile = CLAUDE_SETTINGS_FILE;

  getGeneralConfig(): Record<string, any> {
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

  saveGeneralConfig(config: Record<string, any>): void {
    try {
      const dir = path.dirname(CLAUDE_GENERAL_CONFIG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CLAUDE_GENERAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save general config:', error);
      throw error;
    }
  }

  getActiveSettings(): Record<string, any> {
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

  saveActiveSettings(settings: Record<string, any>): void {
    try {
      fs.writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save Claude settings:', error);
      throw error;
    }
  }

  buildEnvFromGeneralConfig(): { env: Record<string, string>; mergedSettings: Record<string, any> } {
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

  applyProvider(provider: Provider, update: boolean = false): void {
    const settings = this.getActiveSettings();
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

    if (update) {
      this.saveActiveSettings(settings);
    }
  }

  clearConfig(): void {
    const settings = this.getActiveSettings();
    const env = settings.env || {};

    for (const key of PROVIDER_ENV_KEYS) {
      delete env[key];
    }

    settings.env = env;
    this.saveActiveSettings(settings);
  }

  applyGeneralConfigOnly(): void {
    const settings = this.getActiveSettings();
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

    this.saveActiveSettings(settings);
  }
}
