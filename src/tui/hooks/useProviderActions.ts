import { useCallback } from "react"
import type { Provider, CliTarget } from "../../types"
import { configStore } from "../../config/store"
import { testProvider } from "../../utils/api/index"
import { saveProvider } from "../../commands/add"
import type { DetailContent } from "../components/types/detail"

interface UseProviderActionsProps {
  loadProviders: () => void
  providers: Provider[]
  activeProvider: Provider | null
  showDefaultDetails: () => void
  showProviderDetails: (provider: Provider) => void
  updateStatus: (msg: string) => void
  cliTarget: CliTarget
}

export function useProviderActions({
  loadProviders,
  providers,
  activeProvider,
  showDefaultDetails,
  showProviderDetails,
  updateStatus,
  cliTarget
}: UseProviderActionsProps) {
  const switchToProvider = useCallback((provider: Provider) => {
    const target = provider.target || cliTarget
    configStore.applyProvider(provider, true)
    configStore.setActiveProvider(provider.id, target)
  }, [cliTarget])

  const switchToDefault = useCallback(() => {
    configStore.clearProviderConfig(cliTarget)
  }, [cliTarget])

  const deleteProvider = useCallback((provider: Provider) => {
    configStore.deleteProvider(provider.id)
    loadProviders()
    showDefaultDetails()
    updateStatus("Provider deleted")
  }, [loadProviders, showDefaultDetails, updateStatus])

  const editProvider = useCallback((id: string, updates: Partial<Provider>) => {
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
  }) => {
    const provider = saveProvider(data)
    loadProviders()
    return provider
  }, [loadProviders])

  const pingProvider = useCallback(async (provider: Provider) => {
    return await testProvider(provider)
  }, [])

  const handleSelectProvider = useCallback((index: number): DetailContent | null => {
    if (index === 0) {
      try {
        switchToDefault()
        loadProviders()
        showDefaultDetails()
        updateStatus("Switched to Default (Official)")
      } catch {
        showDefaultDetails()
      }
      return { type: "default", isActive: true }
    }

    const provider = providers[index - 1]
    if (provider) {
      try {
        switchToProvider(provider)
        loadProviders()
        showProviderDetails(provider)
        updateStatus(`Switched to {${provider.name}}`)
      } catch {
        showProviderDetails(provider)
      }
      return { type: "provider", provider, isActive: activeProvider?.id === provider.id }
    }
    return null
  }, [providers, activeProvider, switchToProvider, switchToDefault, loadProviders, showDefaultDetails, showProviderDetails, updateStatus])

  return {
    switchToProvider,
    switchToDefault,
    deleteProvider,
    editProvider,
    addProvider,
    pingProvider,
    handleSelectProvider
  }
}
