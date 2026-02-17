// Type definitions for Persona

export interface ProviderModels {
  haiku?: string;
  opus?: string;
  sonnet?: string;
  default?: string;
}

export interface Provider {
  id: string;
  name: string;
  website: string;
  apiKey: string;
  baseUrl: string;
  apiFormat: 'anthropic-messages' | 'openai-completions';
  models: ProviderModels;
  isDefault?: boolean;
  extraEnv?: Record<string, string>;
}

export interface GeneralConfig {
  [key: string]: string | undefined;
}

export interface PersonaConfig {
  providers: Provider[];
  activeProvider: string;
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
