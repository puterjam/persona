import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { createConfigStore, ConfigStore } from './store';
import { Provider } from '../types';

const TEST_DIR = '/tmp/persona-test-' + Date.now();

describe('ConfigStore', () => {
  let store: ConfigStore;

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    store = createConfigStore(TEST_DIR);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Provider CRUD', () => {
    it('should start with empty providers', () => {
      expect(store.getProviders()).toEqual([]);
    });

    it('should add a provider', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      const providers = store.getProviders();

      expect(providers).toHaveLength(1);
      expect(providers[0].id).toBe('test-001');
      expect(providers[0].name).toBe('Test Provider');
    });

    it('should get a provider by id', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      const found = store.getProvider('test-001');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Test Provider');
    });

    it('should return undefined for non-existent provider', () => {
      const found = store.getProvider('non-existent');
      expect(found).toBeUndefined();
    });

    it('should update a provider', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      store.updateProvider('test-001', { name: 'Updated Provider' });

      const found = store.getProvider('test-001');
      expect(found?.name).toBe('Updated Provider');
    });

    it('should delete a provider', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      expect(store.getProviders()).toHaveLength(1);

      store.deleteProvider('test-001');
      expect(store.getProviders()).toHaveLength(0);
    });

    it('should add multiple providers', () => {
      const p1: Provider = { id: 'p1', name: 'P1', website: '', apiKey: '', baseUrl: '', apiFormat: 'anthropic-messages', models: {} };
      const p2: Provider = { id: 'p2', name: 'P2', website: '', apiKey: '', baseUrl: '', apiFormat: 'anthropic-messages', models: {} };

      store.addProvider(p1);
      store.addProvider(p2);

      expect(store.getProviders()).toHaveLength(2);
    });
  });

  describe('Active Provider', () => {
    it('should set active provider for claude', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      store.setActiveProvider('test-001', 'claude');

      const active = store.getActiveProvider('claude');
      expect(active?.id).toBe('test-001');
    });

    it('should set active provider for codex', () => {
      const provider: Provider = {
        id: 'test-codex',
        name: 'Codex Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'openai-completions',
        models: { default: 'test-model' },
        target: 'codex',
      };

      store.addProvider(provider);
      store.setActiveProvider('test-codex', 'codex');

      const active = store.getActiveProvider('codex');
      expect(active?.id).toBe('test-codex');
    });

    it('should clear active provider', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      store.setActiveProvider('test-001', 'claude');
      store.clearActiveProvider('claude');

      const active = store.getActiveProvider('claude');
      expect(active).toBeUndefined();
    });

    it('should return undefined when no active provider', () => {
      const active = store.getActiveProvider('claude');
      expect(active).toBeUndefined();
    });
  });

  describe('Theme', () => {
    it('should get default theme', () => {
      expect(store.getTheme()).toBe('persona');
    });

    it('should set theme', () => {
      store.setTheme('dark');
      expect(store.getTheme()).toBe('dark');
    });
  });

  describe('General Config', () => {
    it('should get config directory', () => {
      expect(store.getConfigDir()).toBe(TEST_DIR);
    });

    it('should get and save general config', () => {
      const config = { testKey: 'testValue' };
      store.saveGeneralConfig(config, 'claude');

      const loaded = store.getGeneralConfig('claude');
      expect(loaded.testKey).toBe('testValue');
    });
  });

  describe('Delete provider cleanup', () => {
    it('should clear active claude provider when deleted', () => {
      const provider: Provider = {
        id: 'test-001',
        name: 'Test Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'anthropic-messages',
        models: { default: 'test-model' },
      };

      store.addProvider(provider);
      store.setActiveProvider('test-001', 'claude');
      store.deleteProvider('test-001');

      const active = store.getActiveProvider('claude');
      expect(active).toBeUndefined();
    });

    it('should clear active codex provider when deleted', () => {
      const provider: Provider = {
        id: 'test-codex',
        name: 'Codex Provider',
        website: 'https://test.com',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.test.com',
        apiFormat: 'openai-completions',
        models: { default: 'test-model' },
        target: 'codex',
      };

      store.addProvider(provider);
      store.setActiveProvider('test-codex', 'codex');
      store.deleteProvider('test-codex');

      const active = store.getActiveProvider('codex');
      expect(active).toBeUndefined();
    });
  });
});
