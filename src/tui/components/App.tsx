import { useState, useEffect, useCallback, useRef } from "react"
import { useRenderer, useKeyboard } from "@opentui/react"
import type { CliRenderer, SelectOption } from "@opentui/core"
import type { Provider } from "../../types"
import { configStore } from "../../config/store"
import { getThemeColors } from "../../utils/theme"
import { testProvider } from "../../utils/api"
import { Header } from "./Header"
import { StatusBar } from "./StatusBar"
import { DetailPanel } from "./DetailPanel"
import { ConfirmDialog } from "./dialogs/ConfirmDialog"
import { InputDialog } from "./dialogs/InputDialog"
import { ListDialog } from "./dialogs/ListDialog"
import { getTemplateNames, getTemplateByFullName } from "../../config/templates"
import { saveProvider, ProviderFormDefaults } from "../../commands/add"
import { VERSION } from "../../version"

interface DetailContent {
  type: "default" | "provider" | "ping" | "message"
  provider?: Provider
  isActive?: boolean
  message?: string
  pingResult?: {
    success: boolean
    latency?: number
    timingBreakdown?: { dns?: string; connect?: string; ttfb?: string; api?: string }
    error?: string
  }
}

interface TuiAppProps {
  renderer: CliRenderer
}

export function TuiApp({ renderer }: TuiAppProps) {
  const defaultStatus = "{↑↓} Navigate {enter} use provider {a/e/d} add/edit/del {p} Ping {r} refresh {q} quit"

  const themeColors = getThemeColors()
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [statusMessage, setStatusMessage] = useState(defaultStatus)
  const [detailContent, setDetailContent] = useState<DetailContent | null>(null)
  const [listContainerKey, setListContainerKey] = useState(0)
  const [selectFocused, setSelectFocused] = useState(true)
  
  const [dialogState, setDialogState] = useState<{
    type: "confirm" | "input" | "list" | null
    data: any
    resolve: ((value: any) => void) | null
  }>({ type: null, data: {}, resolve: null })

  const loadProviders = useCallback(() => {
    const loadedProviders = configStore.getProviders()
    console.error('[DEBUG] loadProviders called, providers:', loadedProviders.length, loadedProviders.map(p => p.name))
    setProviders(loadedProviders)
    const active = configStore.getActiveProvider()
    setActiveProvider(active ?? null)
  }, [])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])


  const updateStatus = (msg: string) => {
    setStatusMessage(msg)
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = setTimeout(() => {
      setStatusMessage(defaultStatus)
    }, 2000)
  }

  const showDefaultDetails = () => {
    const isDefaultActive = !activeProvider
    setDetailContent({
      type: "default",
      isActive: isDefaultActive
    })
  }

  const showProviderDetails = (provider: Provider) => {
    const isActive = activeProvider?.id === provider.id
    setDetailContent({
      type: "provider",
      provider,
      isActive
    })
  }

  useEffect(() => {
    if (providers.length === 0) {
      showDefaultDetails()
    } else if (selectedIndex === 0) {
      showDefaultDetails()
    } else if (providers[selectedIndex - 1]) {
      showProviderDetails(providers[selectedIndex - 1])
    }
  }, [selectedIndex, providers, activeProvider])

  const handleSelectChange = (index: number, option: any) => {
    setSelectedIndex(index)
    if (index === 0) {
      showDefaultDetails()
    } else if (providers[index - 1]) {
      showProviderDetails(providers[index - 1])
    }
  }

  const handleSelectItem = async (index: number, option: any) => {
    if (index === 0) {
      try {
        configStore.clearProviderConfig()
        setActiveProvider(null)
        loadProviders()
        showDefaultDetails()
        updateStatus("Switched to Default (Official)")
      } catch {
        showDefaultDetails()
      }
    } else if (providers[index - 1]) {
      const provider = providers[index - 1]
      try {
        configStore.applyProviderToClaude(provider, true)
        configStore.setActiveProvider(provider.id)
        setActiveProvider(provider)
        loadProviders()
        showProviderDetails(provider)
        updateStatus(`Switched to {${provider.name}}`)
      } catch {
        showProviderDetails(provider)
      }
    }
  }

  const handlePing = async (provider: Provider) => {
    setDetailContent({
      type: "message",
      message: `Pinging [${provider.name}]...`
    })
    updateStatus("Pinging...")
    
    const result = await testProvider(provider)
    
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
        pingResult: {
          success: false,
          error: result.error || "Unknown error"
        }
      })
      updateStatus("Ping failed!")
    }
  }

  const showConfirmDialog = (title: string, message: string): Promise<boolean | null> => {
    return new Promise((resolve) => {
      setSelectFocused(false)
      setDialogState({ type: "confirm", data: { title, message }, resolve })
    })
  }

  const showInputDialog = (
    title: string,
    message: string,
    defaultValue: string = "",
    required: boolean = false
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setSelectFocused(false)
      setDialogState({ type: "input", data: { title, message, defaultValue, required }, resolve })
    })
  }

  const showListDialog = (
    title: string,
    choices: { name: string; value: string }[]
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setSelectFocused(false)
      setDialogState({ type: "list", data: { title, choices }, resolve })
    })
  }

  const handleDialogClose = (result: any) => {
    if (dialogState.resolve) {
      dialogState.resolve(result)
    }
    setDialogState({ type: null, data: {}, resolve: null })
    setSelectFocused(true)
  }

  const handleDelete = async (provider: Provider) => {
    const confirmed = await showConfirmDialog(
      "Delete Provider",
      `Are you sure you want to delete "${provider.name}"?`
    )

    if (confirmed) {
      configStore.deleteProvider(provider.id)
      loadProviders()
      setSelectedIndex(0)
      showDefaultDetails()
      updateStatus("Provider deleted")
    }
  }

  const handleEdit = async (provider: Provider) => {
    setDetailContent({
      type: "message",
      message: `Editing ${provider.name}...`
    })
    // updateStatus("Editing provider...")

   
    const name = await showInputDialog("Edit Name", "Name", provider.name, true)
    if (name === null) return

    const baseUrl = await showInputDialog("Edit Base URL", "Base URL", provider.baseUrl, true)
    if (baseUrl === null) return

    const apiKey = await showInputDialog("Edit API Key", "API Key (leave empty to keep current)", "")
    if (apiKey === null) return

    const apiFormat = provider.apiFormat

    const defaultModel = await showInputDialog("Edit Default Model", "Default Model", provider.models.default || "", true)
    if (defaultModel === null) return

    const haikuModel = await showInputDialog("Edit Haiku Model", "Haiku model name (optional):", provider.models.haiku || "")
    if (haikuModel === null) return

    const opusModel = await showInputDialog("Edit Opus Model", "Opus model name (optional):", provider.models.opus || "")
    if (opusModel === null) return

    const sonnetModel = await showInputDialog("Edit Sonnet Model", "Sonnet model name (optional):", provider.models.sonnet || "")
    if (sonnetModel === null) return

    const updates: Partial<Provider> = {
      name: name || provider.name,
      baseUrl: baseUrl || provider.baseUrl,
      apiFormat: apiFormat,
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined,
      }
    }

     console.log("Editing provider:", updates)

    if (apiKey) {
      updates.apiKey = apiKey
    }

    configStore.updateProvider(provider.id, updates)

    loadProviders()
    setDetailContent({
      type: "message",
      message: `✓ Provider "${name}" updated successfully!`
    })
    updateStatus("Provider updated")
  }

  const handleAddProvider = async () => {
    let defaults: ProviderFormDefaults = {}
    
    const useTemplate = await showConfirmDialog(
      "Use Provider Template",
      "Would you like to use a provider template?"
    )
    
    if (useTemplate === null) return
    
    if (useTemplate) {
      const templateNames = getTemplateNames()
      const choices = templateNames.map((name: string) => {
        const t = getTemplateByFullName(name)
        return { name: `${t?.name} - ${t?.description}`, value: name }
      })
      
      const selectedTemplate = await showListDialog("Select a Template", choices)
      
      if (!selectedTemplate) return
      
      const template = getTemplateByFullName(selectedTemplate)
      if (template) {
        defaults = {
          name: template.name,
          website: template.website,
          baseUrl: template.baseUrl,
          apiFormat: template.apiFormat,
          models: { ...template.defaultModels },
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
    
    const haikuModel = await showInputDialog("Haiku Model", "Haiku model name (optional):", defaults.models?.haiku || "")
    if (haikuModel === null) return
    
    const opusModel = await showInputDialog("Opus Model", "Opus model name (optional):", defaults.models?.opus || "")
    if (opusModel === null) return
    
    const sonnetModel = await showInputDialog("Sonnet Model", "Sonnet model name (optional):", defaults.models?.sonnet || "")
    if (sonnetModel === null) return
    
    const provider = saveProvider({
      name,
      website,
      baseUrl,
      apiKey,
      apiFormat: "anthropic-messages",
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined,
      },
    })
    
    loadProviders()
    setDetailContent({
      type: "message",
      message: `
✓ Provider "${provider.name}" added successfully!
Provider ID: ${provider.id}

Select a provider to view details.
`
    })
    updateStatus(`Provider "${provider.name}" added`)
  }

  useKeyboard((key) => {
    // Check current dialog state - dialogs handle their own keyboard events
    if (dialogState.type !== null) return

    switch (key.name) {
      case "a":
        handleAddProvider()
        break
      case "e":
        if (providers[selectedIndex - 1]) {
          handleEdit(providers[selectedIndex - 1])
        }
        break
      case "p":
        if (providers[selectedIndex - 1]) {
          handlePing(providers[selectedIndex - 1])
        }
        break
      case "d":
        if (providers[selectedIndex - 1]) {
          handleDelete(providers[selectedIndex - 1])
        }
        break
      case "r":
        loadProviders()
        setListContainerKey((k: number) => k + 1)
        updateStatus("Refreshed")
        break
      case "q":
        renderer.destroy()
        break
    }
  }, { release: false })

  const listOptions: SelectOption[] = [
    { name: !activeProvider ? "(Default) ✓" : "(Default)", description: "Anthropic official", value: "default" },
    ...providers.map((p: Provider) => {
      const isActive = activeProvider?.id === p.id
      return { name: isActive ? `${p.name} ✓` : p.name, description: p.models.default || "", value: p.id }
    })
  ]

    renderer.setBackgroundColor(themeColors.overlay) 

  return (
    <>
      <Header colors={themeColors} version={VERSION} />
      
      <box
        flexDirection="row"
        position="absolute"
        top={7}
        left={10}
        width="80%"
        height={renderer.height - 11}
      >
        <box
          key={listContainerKey}
          width="30%"
          height="100%"
          flexGrow={0}
          flexShrink={0}
          paddingX={2}
          paddingY={1}
          backgroundColor={themeColors.bgLight}
          border={["right"]}
          borderColor={themeColors.border}
          borderStyle="heavy"
        >
          <select
            options={listOptions}
            width="100%"
            height="100%"
            selectedIndex={selectedIndex}
            onChange={handleSelectChange}
            onSelect={handleSelectItem}
            focused={selectFocused}
            textColor={themeColors.text}
            backgroundColor="transparent"
            focusedBackgroundColor="transparent"
            focusedTextColor={themeColors.text}
            selectedBackgroundColor={themeColors.selected}
            selectedTextColor={themeColors.selectedText}
            descriptionColor={themeColors.textMuted}
            showDescription={true}
            showScrollIndicator={true}
            wrapSelection={false}
          />
        </box>
        
        <DetailPanel
          content={detailContent}
          colors={themeColors}
        />
      </box>
      
      <StatusBar
        message={statusMessage}
        colors={themeColors}
        version={VERSION}
      />
      
      {dialogState.type === "confirm" && (
        <ConfirmDialog
          title={dialogState.data.title}
          message={dialogState.data.message}
          onClose={handleDialogClose}
        />
      )}
      
      {dialogState.type === "input" && (
        <InputDialog
          key={dialogState.data.title + dialogState.data.defaultValue}
          title={dialogState.data.title}
          message={dialogState.data.message}
          defaultValue={dialogState.data.defaultValue}
          required={dialogState.data.required}
          onClose={handleDialogClose}
        />
      )}
      
      {dialogState.type === "list" && (
        <ListDialog
          title={dialogState.data.title}
          choices={dialogState.data.choices}
          onClose={handleDialogClose}
        />
      )}
    </>
  )
}
