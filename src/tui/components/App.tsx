import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useKeyboard } from "@opentui/react"
import type { CliRenderer, SelectOption } from "@opentui/core"
import type { Provider, CliTarget } from "../../types"
import { configStore } from "../../config/store"
import { getThemeColors, loadTheme, getThemeNames, setThemeColors } from "../../utils/theme"
import { Header } from "./layout/Header"
import { StatusBar } from "./layout/StatusBar"
import { DetailPanel } from "./DetailPanel"
import { ProviderList } from "./ProviderList"
import { ConfirmDialog } from "./dialogs/ConfirmDialog"
import { InputDialog } from "./dialogs/InputDialog"
import { ListDialog } from "./dialogs/ListDialog"
import { getTemplateNames, getTemplateByFullName, getCategoryNames } from "../../config/templates"
import { VERSION } from "../../version"
import { useProviders } from "../hooks/useProviders"
import { useDialogs } from "../hooks/useDialogs"
import type { DetailContent } from "./types/detail"

interface TuiAppProps {
  renderer: CliRenderer
}

export function TuiApp({ renderer }: TuiAppProps) {
  const defaultStatus = "{↑↓} Navigate {enter} use provider {tab} switch CLI {a/e/d} add/edit/del {p} Ping {t} theme {q} quit"

  const themeColors = getThemeColors()
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [statusMessage, setStatusMessage] = useState(defaultStatus)
  const [detailContent, setDetailContent] = useState<DetailContent | null>(null)
  const [listContainerKey, setListContainerKey] = useState(0)
  const [selectFocused, setSelectFocused] = useState(true)
  const [cliTarget, setCliTarget] = useState<CliTarget>("claude")

  const {
    providers: allProviders,
    activeProvider,
    loadProviders,
    deleteProviderById,
    updateProvider,
    addProvider,
    pingProvider
  } = useProviders(cliTarget)

  // Filter providers by target
  // Filter by target: claude shows providers with target=claude or no target (backwards compatible)
  // codex shows only providers with target=codex
  const providers = useMemo(() =>
    cliTarget === "codex"
      ? allProviders.filter(p => p.target === "codex")
      : allProviders.filter(p => !p.target || p.target === "claude"),
    [allProviders, cliTarget]
  )

  const {
    dialogState,
    showConfirmDialog,
    showInputDialog,
    showListDialog,
    closeDialog
  } = useDialogs()

  useEffect(() => {
    setSelectFocused(dialogState.type === null)
  }, [dialogState.type])

  const updateStatus = useCallback((msg: string) => {
    setStatusMessage(msg)
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = setTimeout(() => {
      setStatusMessage(defaultStatus)
    }, 2000)
  }, [defaultStatus])

  const showDefaultDetails = useCallback(() => {
    setDetailContent({ type: "default", isActive: !activeProvider })
  }, [activeProvider])

  const showProviderDetails = useCallback((provider: Provider) => {
    setDetailContent({
      type: "provider",
      provider,
      isActive: activeProvider?.id === provider.id
    })
  }, [activeProvider])

  useEffect(() => {
    if (detailContent?.type === "ping" || detailContent?.type === "message") return
    if (providers.length === 0 || selectedIndex === 0) {
      showDefaultDetails()
    } else if (providers[selectedIndex - 1]) {
      showProviderDetails(providers[selectedIndex - 1])
    }
  }, [selectedIndex, providers, showDefaultDetails, showProviderDetails])

  const handleSelectChange = useCallback((index: number) => {
    setSelectedIndex(index)
    if (index === 0) {
      showDefaultDetails()
    } else if (providers[index - 1]) {
      showProviderDetails(providers[index - 1])
    }
  }, [providers, showDefaultDetails, showProviderDetails])

  const getBorderColor = useCallback(() => {
    if (selectedIndex === 0) return themeColors.border
    const provider = providers[selectedIndex - 1]
    if (provider) {
      return activeProvider?.id === provider.id ? themeColors.primaryLight : themeColors.border
    }
    return themeColors.border
  }, [selectedIndex, providers, activeProvider, themeColors])

  const handlePing = async (provider: Provider) => {
    setDetailContent({ type: "message", message: `Pinging [${provider.name}]...` })
    updateStatus("Pinging...")

    const result = await pingProvider(provider)

    if (result.success) {
      setDetailContent({
        type: "ping",
        pingResult: {
          success: true,
          latency: result.latency,
          timingBreakdown: result.timingBreakdown ? {
            dns: result.timingBreakdown.dns?.toString(),
            connect: result.timingBreakdown.connect?.toString(),
            ttfb: result.timingBreakdown.ttfb?.toString(),
            api: result.timingBreakdown.api?.toString()
          } : undefined
        }
      })
      updateStatus("Ping successful!")
    } else {
      setDetailContent({
        type: "ping",
        pingResult: { success: false, error: result.error || "Unknown error" }
      })
      updateStatus("Ping failed!")
    }
  }

  const handleDelete = async (provider: Provider) => {
    const confirmed = await showConfirmDialog("Delete Provider", `Are you sure you want to delete "${provider.name}"?`)
    if (confirmed) {
      deleteProviderById(provider.id)
      setSelectedIndex(0)
      showDefaultDetails()
      updateStatus("Provider deleted")
    }
  }

  const handleEdit = async (provider: Provider) => {
    const isCodex = provider.target === "codex"

    const name = await showInputDialog("Edit Name", "Name", provider.name, true)
    if (name === null) return

    const baseUrl = await showInputDialog("Edit Base URL", "Base URL", provider.baseUrl, true)
    if (baseUrl === null) return

    const apiKey = await showInputDialog("Edit API Key", "API Key (leave empty to keep current)", "")
    if (apiKey === null) return

    const defaultModel = await showInputDialog("Edit Default Model", "Default Model", provider.models.default || "", true)
    if (defaultModel === null) return

    let haikuModel, opusModel, sonnetModel, wireApi, requiresOpenAiAuth

    if (isCodex) {
      wireApi = await showInputDialog("Edit Wire API", "Wire API (responses/completions/chat):", provider.wireApi || "responses", true)
      if (wireApi === null) return
      requiresOpenAiAuth = await showConfirmDialog("Requires OpenAI Auth", "Does this provider require OpenAI authentication?")
      if (requiresOpenAiAuth === null) return
    } else {
      haikuModel = await showInputDialog("Edit Haiku Model", "Haiku model name (optional):", provider.models.haiku || "")
      if (haikuModel === null) return
      opusModel = await showInputDialog("Edit Opus Model", "Opus model name (optional):", provider.models.opus || "")
      if (opusModel === null) return
      sonnetModel = await showInputDialog("Edit Sonnet Model", "Sonnet model name (optional):", provider.models.sonnet || "")
      if (sonnetModel === null) return
    }

    const updates: Partial<Provider> = {
      name: name || provider.name,
      baseUrl: baseUrl || provider.baseUrl,
      apiFormat: provider.apiFormat,
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined,
      },
      wireApi: wireApi || undefined,
      requiresOpenAiAuth,
    }

    if (apiKey) updates.apiKey = apiKey

    updateProvider(provider.id, updates)
    setListContainerKey(k => k + 1)
    setDetailContent({ type: "message", message: `✓ Provider "${name}" updated successfully!` })
    updateStatus("Provider updated")
  }

  const handleAddProvider = async () => {
    const isCodex = cliTarget === "codex"

    let defaults: { name?: string; website?: string; baseUrl?: string; apiFormat?: 'anthropic-messages' | 'openai-completions'; models?: { default?: string; haiku?: string; opus?: string; sonnet?: string }; target?: CliTarget; wireApi?: string; requiresOpenAiAuth?: boolean; envKey?: string } = {}

    const useTemplate = await showConfirmDialog("Use Provider Template", "Would you like to use a provider template?")
    if (useTemplate === null) return

    if (useTemplate) {
      // Filter templates by current target
      const templateNames = getTemplateNames()
      const filteredTemplates = templateNames.filter((name: string) => {
        const t = getTemplateByFullName(name)
        if (isCodex) {
          return t && (t as any).target === "codex"
        } else {
          return t && !(t as any).target || (t as any).target === "claude"
        }
      })

      if (filteredTemplates.length === 0) {
        updateStatus("No templates available for this target")
      } else {
        const choices = filteredTemplates.map((name: string) => {
          const t = getTemplateByFullName(name)
          return { name: `${t?.name} - ${t?.description}`, value: name }
        })
        const selectedTemplate = await showListDialog("Select a Template", choices)
        if (selectedTemplate) {
          const template = getTemplateByFullName(selectedTemplate)
          if (template) {
            defaults = {
              name: template.name,
              website: template.website,
              baseUrl: template.baseUrl,
              apiFormat: template.apiFormat,
              models: { ...template.defaultModels },
              target: (template as any).target,
              wireApi: (template as any).wireApi,
              requiresOpenAiAuth: (template as any).requiresOpenAiAuth,
              envKey: (template as any).envKey,
            }
          }
        }
      }
    }

    const name = await showInputDialog("Enter Provider Name", "Provider Name", defaults.name || "", true)
    if (!name) return

    const website = await showInputDialog("Enter Website URL", "Website URL", defaults.website || "https://example.com")
    if (!website) return

    const baseUrl = await showInputDialog("Enter API Base URL", "API Base URL", defaults.baseUrl || "", true)
    if (!baseUrl) return

    const apiKey = await showInputDialog("Enter API Key", "API Key", "", true)
    if (!apiKey) return

    const defaultModel = await showInputDialog("Default Model", "Default model name:", defaults.models?.default || "", true)
    if (defaultModel === null) return

    let haikuModel, opusModel, sonnetModel, wireApi, requiresOpenAiAuth

    if (isCodex) {
      wireApi = await showInputDialog("Wire API", "Wire API (responses/completions/chat):", defaults.wireApi || "responses", true)
      if (wireApi === null) return
      requiresOpenAiAuth = await showConfirmDialog("Requires OpenAI Auth", "Does this provider require OpenAI authentication?")
      if (requiresOpenAiAuth === null) return
    } else {
      haikuModel = await showInputDialog("Haiku Model", "Haiku model name (optional):", defaults.models?.haiku || "")
      if (haikuModel === null) return
      opusModel = await showInputDialog("Opus Model", "Opus model name (optional):", defaults.models?.opus || "")
      if (opusModel === null) return
      sonnetModel = await showInputDialog("Sonnet Model", "Sonnet model name (optional):", defaults.models?.sonnet || "")
      if (sonnetModel === null) return
    }

    const provider = addProvider({
      name, website, baseUrl, apiKey,
      apiFormat: isCodex ? "openai-completions" : "anthropic-messages",
      target: cliTarget,
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined,
      },
      wireApi: wireApi || undefined,
      requiresOpenAiAuth: requiresOpenAiAuth,
      envKey: defaults.envKey || undefined,
    })

    setDetailContent({
      type: "message",
      message: `✓ Provider "${provider.name}" added successfully!\nProvider ID: ${provider.id}\nTarget: ${provider.target || 'claude'}\n\nSelect a provider to view details.`
    })
    setListContainerKey(k => k + 1)
    updateStatus(`Provider "${provider.name}" added`)
  }

  const handleThemeSwitch = async () => {
    const themeNames = getThemeNames()
    const currentThemeName = configStore.getTheme()
    const choices = themeNames.map((name: string) => ({
      name: name === currentThemeName ? `${name} ✓` : name,
      value: name
    }))

    const selectedTheme = await showListDialog("Select Theme", choices)
    if (selectedTheme && selectedTheme !== currentThemeName) {
      configStore.setTheme(selectedTheme)
      loadTheme(selectedTheme)
      setThemeColors(getThemeColors())
      updateStatus(`Theme changed to ${selectedTheme}`)
    }
  }

  const handleSelectProvider = (index: number) => {
    if (index === 0) {
      configStore.clearProviderConfig(cliTarget)
      loadProviders()
      showDefaultDetails()
      updateStatus("Switched to Default (Official)")
    } else if (providers[index - 1]) {
      const provider = providers[index - 1]
      configStore.applyProvider(provider, true)
      configStore.setActiveProvider(provider.id, cliTarget)
      loadProviders()
      showProviderDetails(provider)
      updateStatus(`Switched to {${provider.name}}`)
    }
  }

  useKeyboard((key) => {
    if (dialogState.type !== null) return

    switch (key.name) {
      case "tab":
        // Toggle between Claude and Codex targets
        setCliTarget(prev => prev === "claude" ? "codex" : "claude")
        setSelectedIndex(0)
        setListContainerKey(k => k + 1) // Force refresh list
        updateStatus(`Switched CLI target`)
        break
      case "a": handleAddProvider(); break
      case "e": providers[selectedIndex - 1] && handleEdit(providers[selectedIndex - 1]); break
      case "p": providers[selectedIndex - 1] && handlePing(providers[selectedIndex - 1]); break
      case "d": providers[selectedIndex - 1] && handleDelete(providers[selectedIndex - 1]); break
      case "r": loadProviders(); setListContainerKey(k => k + 1); updateStatus("Refreshed"); break
      case "t": handleThemeSwitch(); break
      case "q": renderer.destroy(); break
    }
  }, { release: false })

  const defaultLabel = cliTarget === "codex" ? "Codex Default" : "Anthropic Official"
  const listOptions: SelectOption[] = [
    { name: !activeProvider ? `(Default) ✓` : "(Default)", description: defaultLabel, value: "default" },
    ...providers.map((p: Provider) => ({
      name: activeProvider?.id === p.id ? `${p.name} ✓` : p.name,
      description: p.models.default || "",
      value: p.id
    }))
  ]

  renderer.setBackgroundColor(themeColors.bg)

  return (
    <>
      <Header colors={themeColors} version={VERSION} cliTarget={cliTarget} />

      <box position="absolute" top={0} left={0} width="100%" height="100%" justifyContent="center" alignItems="center" paddingTop={8} paddingBottom={5}>
        <box flexDirection="row" width="80%" height="100%">
          <ProviderList
            key={listContainerKey}
            options={listOptions}
            selectedIndex={selectedIndex}
            focused={selectFocused}
            borderColor={getBorderColor()}
            colors={themeColors}
            onChange={(idx) => handleSelectChange(idx)}
            onSelect={handleSelectProvider}
          />
          <DetailPanel content={detailContent} colors={themeColors} />
        </box>
      </box>

      <StatusBar message={statusMessage} colors={themeColors} version={VERSION} />

      {dialogState.type === "confirm" && <ConfirmDialog title={dialogState.data.title} message={dialogState.data.message} onClose={closeDialog} />}
      {dialogState.type === "input" && <InputDialog key={dialogState.data.title + dialogState.data.defaultValue} title={dialogState.data.title} message={dialogState.data.message} defaultValue={dialogState.data.defaultValue} required={dialogState.data.required} onClose={closeDialog} />}
      {dialogState.type === "list" && <ListDialog title={dialogState.data.title} choices={dialogState.data.choices} onClose={closeDialog} />}
    </>
  )
}
