// Type definitions for Persona

export type CliTarget = "claude" | "codex";

export interface ProviderModels {
  haiku?: string;
  opus?: string;
  sonnet?: string;
  default?: string;
}

// Main Provider interface - supports all CLI targets
export interface Provider {
  id: string;
  name: string;
  website: string;
  apiKey: string;
  baseUrl: string;
  apiFormat: "anthropic-messages" | "openai-completions";
  models: ProviderModels;
  isDefault?: boolean;
  extraEnv?: Record<string, string>;
  target?: CliTarget;
  // Codex specific
  wireApi?: string;
  requiresOpenAiAuth?: boolean;
  envKey?: string;
}

// Type guards for runtime type checking
export function isCodexProvider(provider: Provider): boolean {
  return provider.target === 'codex';
}

export function isClaudeProvider(provider: Provider): boolean {
  return !provider.target || provider.target === 'claude';
}

export interface GeneralConfig {
  [key: string]: string | Record<string, string | boolean | number> | undefined;
}

export interface PersonaConfig {
  providers: Provider[];
  activeClaudeProvider?: string;
  activeCodexProvider?: string;
  activeProvider?: string;
  generalConfig?: GeneralConfig;
  theme?: string;
}

export interface ClaudeSettings {
  env: Record<string, string>;
  [key: string]: any;
}

export type ApiFormat = 'anthropic-messages' | 'openai-completions';

export interface ProviderTemplate {
  name: string;
  website: string;
  baseUrl: string;
  apiFormat: ApiFormat;
  defaultModels: ProviderModels;
  description: string;
  extraEnv?: Record<string, string>;
  // Template-specific fields
  target?: CliTarget;
  wireApi?: string;
  requiresOpenAiAuth?: boolean;
  envKey?: string;
}

export interface TestResult {
  provider: string;
  success: boolean;
  latency?: number;
  error?: string;
  model?: string;
  endpoint?: string;
  timingBreakdown?: Record<string, number>;
}

// CliAdapter interface - for CLI-specific configuration management
export interface CliAdapter {
  readonly target: CliTarget;
  readonly configFile: string;
  readonly settingsFile: string;

  applyProvider(provider: Provider, update: boolean): void;
  clearConfig(): void;

  getGeneralConfig(): Record<string, any>;
  saveGeneralConfig(config: Record<string, any>): void;

  getActiveSettings(): Record<string, any>;
  saveActiveSettings(settings: Record<string, any>): void;

  buildEnvFromGeneralConfig(): { env: Record<string, string>; mergedSettings: Record<string, any> };

  // Optional method - not all adapters need this
  applyGeneralConfigOnly?(): void;
}
