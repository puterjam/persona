export interface CommandDefinition {
  description: string
  usage: string
  aliases?: string[]
}

export const commands: Record<string, CommandDefinition> = {
  ls: {
    description: 'List all configured providers',
    usage: 'persona list'
  },
  use: {
    description: 'Switch to a provider',
    usage: 'persona use <provider-id>'
  },
  add: {
    description: 'Add a new provider (interactive or with flags)',
    usage: 'persona add [--template <name>] [--name <name>] [--base-url <url>] [--api-key <key>] [--api-format <format>] [--default-model <model>] [--haiku-model <model>] [--opus-model <model>] [--sonnet-model <model>]'
  },
  edit: {
    description: 'Edit an existing provider',
    usage: 'persona edit <provider-id> [--name <name>] [--base-url <url>] [--api-key <key>] [--api-format <format>]'
  },
  remove: {
    aliases: ['rm', 'del'],
    description: 'Delete a provider',
    usage: 'persona remove <provider-id>'
  },
  ping: {
    description: 'Test provider API connection',
    usage: 'persona ping [provider-id]'
  },
  info: {
    description: 'Show current status',
    usage: 'persona status'
  },
  templates: {
    aliases: ['template'],
    description: 'List available provider templates',
    usage: 'persona templates'
  },
  theme: {
    description: 'Manage themes (list, show, set)',
    usage: 'persona theme [list|<name>]'
  },
  env: {
    description: 'Manage environment variable overrides',
    usage: 'persona env [edit|show]'
  },
  sync: {
    description: 'Sync templates and themes from GitHub',
    usage: 'persona sync [--templates] [--themes] [--all] [--force]'
  },
  help: {
    aliases: ['h', '?'],
    description: 'Show help information',
    usage: 'persona help [command]'
  }
}

export const aliasMap: Record<string, string> = {
  ls: 'list',
  new: 'add',
  delete: 'remove',
  rm: 'remove',
  del: 'remove',
  info: 'status',
  current: 'status',
  template: 'templates',
  h: 'help',
  '?': 'help'
}
