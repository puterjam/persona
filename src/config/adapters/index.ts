// Adapter exports and factory function

import { CliAdapter, CliTarget } from '../../types';
import { ClaudeAdapter } from './claude';
import { CodexAdapter } from './codex';

const adapters: Record<CliTarget, CliAdapter> = {
  'claude': new ClaudeAdapter(),
  'codex': new CodexAdapter(),
};

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

export { ClaudeAdapter } from './claude';
export { CodexAdapter } from './codex';
