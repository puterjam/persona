import { useState, useEffect, useCallback } from "react"
import { Provider, CliTarget } from "../../types"
import { configStore } from "../../config/store"
import { testProvider } from "../../utils/api/index"
import { saveProvider, ProviderFormDefaults } from "../../commands/add"

export function useProviders(target: CliTarget = 'claude') {
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null)

  const loadProviders = useCallback(() => {
    const loadedProviders = configStore.getProviders()
    setProviders(loadedProviders)
    const active = configStore.getActiveProvider(target)
    setActiveProvider(active ?? null)
  }, [target])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const switchToProvider = useCallback((provider: Provider) => {
    configStore.applyProvider(provider, true)
    configStore.setActiveProvider(provider.id, target)
    setActiveProvider(provider)
  }, [target])

  const switchToDefault = useCallback(() => {
    configStore.clearProviderConfig(target)
    setActiveProvider(null)
  }, [target])

  const deleteProviderById = useCallback((id: string) => {
    configStore.deleteProvider(id)
    loadProviders()
  }, [loadProviders])

  const updateProvider = useCallback((id: string, updates: Partial<Provider>) => {
    configStore.updateProvider(id, updates)
    loadProviders()
  }, [loadProviders])

  const addProvider = useCallback((data: {
    name: string
    website: string
    baseUrl: string
    apiKey: string
    apiFormat: 'anthropic-messages' | 'openai-completions'
    models: { default?: string; haiku?: string; opus?: string; sonnet?: string }
    target?: 'claude' | 'codex'
    wireApi?: string
    requiresOpenAiAuth?: boolean
    envKey?: string
  }) => {
    const provider = saveProvider(data)
    loadProviders()
    return provider
  }, [loadProviders])

  const pingProvider = useCallback(async (provider: Provider) => {
    return await testProvider(provider)
  }, [])

  return {
    providers,
    activeProvider,
    loadProviders,
    switchToProvider,
    switchToDefault,
    deleteProviderById,
    updateProvider,
    addProvider,
    pingProvider
  }
}
