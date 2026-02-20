// Adapter exports and factory function

import { CliAdapter, CliTarget } from '../../types';
import { ClaudeAdapter } from './claude';
import { CodexAdapter } from './codex';

let configDir: string = '';

export function setConfigDir(dir: string): void {
  configDir = dir;
}

export function getConfigDir(): string {
  return configDir;
}

function createAdapters(): Record<CliTarget, CliAdapter> {
  return {
    'claude': new ClaudeAdapter(configDir),
    'codex': new CodexAdapter(configDir),
  };
}

let adapters: Record<CliTarget, CliAdapter> = createAdapters();

export function getAdapter(target: CliTarget): CliAdapter {
  const adapter = adapters[target];
  if (!adapter) {
    throw new Error(`No adapter found for target: ${target}`);
  }
  return adapter;
}

export function getAvailableTargets(): CliTarget[] {
  return Object.keys(adapters) as CliTarget[];
}

export function resetAdapters(): void {
  adapters = createAdapters();
}

export { ClaudeAdapter } from './claude';
export { CodexAdapter } from './codex';
