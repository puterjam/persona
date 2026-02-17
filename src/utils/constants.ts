export const API_FORMAT_OPTIONS = [
  { name: 'Anthropic Messages API', value: 'anthropic-messages' as const },
  { name: 'OpenAI Chat Completions API', value: 'openai-completions' as const }
];

export const PROVIDER_ENV_KEYS = [
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_API_FORMAT'
] as const;
