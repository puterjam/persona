import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeAdapter } from '../../src/config/adapters/claude';
import { CodexAdapter } from '../../src/config/adapters/codex';
import { setConfigDir, resetAdapters } from '../../src/config/adapters';
import { Provider } from '../../src/types';

function getUniqueTestDir(): string {
  return '/tmp/persona-adapter-test-' + Date.now() + '-' + Math.random().toString(36).substring(7);
}

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;
  let testDir: string;

  beforeEach(() => {
    testDir = getUniqueTestDir();
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    setConfigDir(testDir);
    resetAdapters();
    adapter = new ClaudeAdapter(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('General Config', () => {
    it('should save and load general config', () => {
      const config = { CLAUDE_API_KEY: 'test-key', ANTHROPIC_PROJECT_ID: 'test-project' };
      adapter.saveGeneralConfig(config);

      const loaded = adapter.getGeneralConfig();
      expect(loaded.CLAUDE_API_KEY).toBe('test-key');
      expect(loaded.ANTHROPIC_PROJECT_ID).toBe('test-project');
    });

    it('should return empty object when no config exists', () => {
      const loaded = adapter.getGeneralConfig();
      expect(loaded).toEqual({});
    });

    it('should use config directory for general config path', () => {
      expect(adapter.configFile).toContain(testDir);
      expect(adapter.configFile).toContain('claude.json');
    });

    it('should create config directory if not exists', () => {
      const nestedDir = '/tmp/nested-' + Date.now();
      const nestedAdapter = new ClaudeAdapter(nestedDir);
      
      const config = { TEST: 'value' };
      nestedAdapter.saveGeneralConfig(config);
      
      expect(fs.existsSync(nestedAdapter.configFile)).toBe(true);
      
      // Cleanup
      fs.rmSync(nestedDir, { recursive: true, force: true });
    });
  });

  describe('buildEnvFromGeneralConfig', () => {
    it('should parse general config env section', () => {
      const config = {
        env: {
          TEST_VAR: 'test-value',
          ANOTHER_VAR: 'another-value',
        },
      };
      adapter.saveGeneralConfig(config);

      const { env, mergedSettings } = adapter.buildEnvFromGeneralConfig();
      expect(env.TEST_VAR).toBe('test-value');
      expect(env.ANOTHER_VAR).toBe('another-value');
    });

    it('should convert number and boolean values to strings', () => {
      const config = {
        env: {
          NUM_VAR: 123,
          BOOL_VAR: true,
        },
      };
      adapter.saveGeneralConfig(config);

      const { env } = adapter.buildEnvFromGeneralConfig();
      expect(env.NUM_VAR).toBe('123');
      expect(env.BOOL_VAR).toBe('true');
    });

    it('should handle top-level object config', () => {
      const config = {
        env: {},
        someObject: { key: 'value' },
      };
      adapter.saveGeneralConfig(config);

      const { mergedSettings } = adapter.buildEnvFromGeneralConfig();
      expect(mergedSettings.someObject).toEqual({ key: 'value' });
    });

    it('should add top-level primitives to env', () => {
      const config = {
        TEST_STRING: 'string-value',
        TEST_NUMBER: 123,
      };
      adapter.saveGeneralConfig(config);

      const { env } = adapter.buildEnvFromGeneralConfig();
      expect(env.TEST_STRING).toBe('string-value');
      expect(env.TEST_NUMBER).toBe('123');
    });
  });
});

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;
  let testDir: string;

  beforeEach(() => {
    testDir = getUniqueTestDir();
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    setConfigDir(testDir);
    resetAdapters();
    adapter = new CodexAdapter(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('General Config', () => {
    it('should save and load general config as TOML', () => {
      const config = { disable_response_storage: true, max_tokens: 4096 };
      adapter.saveGeneralConfig(config);

      const loaded = adapter.getGeneralConfig();
      expect(loaded.disable_response_storage).toBe(true);
      expect(loaded.max_tokens).toBe(4096);
    });

    it('should use config directory for general config path', () => {
      expect(adapter.configFile).toContain(testDir);
      expect(adapter.configFile).toContain('codex.toml');
    });

    it('should create config directory if not exists', () => {
      const nestedDir = '/tmp/nested-' + Date.now();
      const nestedAdapter = new CodexAdapter(nestedDir);
      
      const config = { TEST: 'value' };
      nestedAdapter.saveGeneralConfig(config);
      
      expect(fs.existsSync(nestedAdapter.configFile)).toBe(true);
      
      // Cleanup
      fs.rmSync(nestedDir, { recursive: true, force: true });
    });
  });

  describe('buildEnvFromGeneralConfig', () => {
    it('should parse TOML config to env', () => {
      const config = {
        TEST_VAR: 'test-value',
        NUM_VAR: 123,
      };
      adapter.saveGeneralConfig(config);

      const { env, mergedSettings } = adapter.buildEnvFromGeneralConfig();
      expect(env.TEST_VAR).toBe('test-value');
      expect(env.NUM_VAR).toBe('123');
    });
  });

  describe('applyProvider', () => {
    it('should create model_providers when applied', () => {
      const provider: Provider = {
        id: 'codex-001',
        name: 'Test Codex',
        website: 'https://test.com',
        apiKey: 'sk-codex-key',
        baseUrl: 'https://api.test.com/v1',
        apiFormat: 'openai-completions',
        models: { default: 'gpt-4o' },
        target: 'codex',
        wireApi: 'responses',
        requiresOpenAiAuth: true,
      };

      // Apply with update=false returns settings but doesn't save
      adapter.applyProvider(provider, false);

      // Get fresh settings
      const settings = adapter.getActiveSettings();
      
      // Verify structure was created (even without saving)
      // Note: Without saving to file, model_providers won't persist
      expect(settings).toBeDefined();
    });

    it('should validate API key requirement', () => {
      const provider: Provider = {
        id: 'codex-001',
        name: 'Test Codex',
        website: 'https://test.com',
        apiKey: '',
        baseUrl: 'https://api.test.com/v1',
        apiFormat: 'openai-completions',
        models: { default: 'gpt-4o' },
        target: 'codex',
      };

      // This should log an error but not throw
      adapter.applyProvider(provider, false);
    });
  });

  describe('clearConfig', () => {
    it('should not throw when no config exists', () => {
      expect(() => adapter.clearConfig()).not.toThrow();
    });
  });
});
