import { testProvider } from "./api"
import { getTemplateNames, getTemplateByFullName } from "../config/templates"
import { Provider } from "../types"
import { saveProvider, ProviderFormDefaults } from "../commands/add"
import { setRenderer, getCurrentDialog, getIsInputMode, showConfirmDialog, showInputDialog, showListDialog } from "./tui/dialogs"
import { getRenderer, getProviderSelect, getDetailText, initViews, refreshProviderList, updateStatus, showProviderDetails, switchToProvider, getSelectedProviderIndex, destroyViews, focusProviderSelect, blurProviderSelect } from "./tui/views"
import { t, fg, bold } from "@opentui/core"
import { getColors } from "./tui/components"
import { loadThemeFromConfig } from "./theme"

export async function startInteractiveMode(): Promise<void> {
  loadThemeFromConfig()
  
  const renderer = await initViews()
  setRenderer(renderer)

  refreshProviderList()

  renderer.keyInput.on("keypress", handleGlobalKeyPress)

  const cleanup = () => {
    destroyViews()
  }
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)

  renderer.start()
}

async function testProviderInTui(provider: Provider): Promise<void> {
  const detailText = getDetailText()
  if (!detailText) return

  detailText.content = t`Pinging [${bold(provider.name)}]...`
  updateStatus("Pinging...")

  const result = await testProvider(provider)

  if (result.success) {
    const latency = result.latency ?? 0
    let content: any = ""

    if (result.timingBreakdown) {
      const { dns, connect, ttfb, api } = result.timingBreakdown
content = t`✓ Ping successful! 

  Latency: ${fg(getColors().success)(latency + "ms")}
    ${fg(getColors().textMuted)("  DNS:")} ${fg(getColors().textHighlight)((dns || "N/A") + " ms")} 
    ${fg(getColors().textMuted)(" CONN:")} ${fg(getColors().textHighlight)((connect || "N/A") + " ms")} 
    ${fg(getColors().textMuted)(" TTFB:")} ${fg(getColors().textHighlight)((ttfb || "N/A" )+ " ms")} 
    ${fg(getColors().textMuted)("  API:")} ${fg(getColors().textHighlight)((api || "N/A") + " ms")} 
`
      detailText.content = content
    } else {
      detailText.content = t`✓ Ping successful! Latency: ${fg(getColors().success)(latency + "ms")}`
    }
    
    updateStatus("Ping successful!")
  } else {
    detailText.content = t`✗ Ping failed: ${fg(getColors().error)(result.error ?? "Unknown error")}`
    updateStatus("Ping failed!")
  }
}

async function deleteProviderInTui(provider: Provider): Promise<void> {
  const detailText = getDetailText()
  if (!detailText) return

  const confirmed = await showConfirmDialog(
    "Delete Provider",
    `Are you sure you want to delete "${provider.name}"?`
  )

  if (confirmed) {
    const { configStore } = await import("../config/store")
    configStore.deleteProvider(provider.id)
    refreshProviderList()
    focusProviderSelect()

    if (detailText) {
      detailText.content = `✓ Provider deleted. Select another provider.`
    }
    updateStatus("Provider deleted")
  }
}

async function editProviderInTui(provider: Provider): Promise<void> {
  const detailText = getDetailText()
  if (!detailText) return

  detailText.content = t`Editing ${fg(getColors().primary)(provider.name)}...`
  
  const name = await showInputDialog("Edit Provider", "Name:", provider.name,true)
  if (name === null) return

  const baseUrl = await showInputDialog("Edit Provider", "Base URL:", provider.baseUrl,true)
  if (baseUrl === null) return

  const apiKey = await showInputDialog("Edit Provider", "API Key (leave empty to keep current):", "")
  if (apiKey === null) return

  // Default to Anthropic Messages format (OpenAI format temporarily disabled)
  const apiFormat = provider.apiFormat

  const defaultModel = await showInputDialog("Edit Default Model:", "Default Model", provider.models.default || "",true)
  if (defaultModel === null) return

  const haikuModel = await showInputDialog("Edit Haiku Model", "Haiku model name (optional)", provider.models.haiku || "")
  if (haikuModel === null) return

  const opusModel = await showInputDialog("Edit Opus Model", "Opus model name (optional)", provider.models.opus || "")
  if (opusModel === null) return

  const sonnetModel = await showInputDialog("Edit Sonnet Model", "Sonnet model name (optional)", provider.models.sonnet || "")
  if (sonnetModel === null) return

  const { configStore } = await import("../config/store")
  
  const updates: Partial<Provider> = {
    name: name || provider.name,
    baseUrl: baseUrl || provider.baseUrl,
    apiFormat: apiFormat as "anthropic-messages" | "openai-completions",
    models: {
      default: defaultModel || undefined,
      haiku: haikuModel || undefined,
      opus: opusModel || undefined,
      sonnet: sonnetModel || undefined,
    }
  }

  if (apiKey) {
    updates.apiKey = apiKey
  }

  configStore.updateProvider(provider.id, updates)
  
  detailText.content = t`✓ Provider ${name} updated successfully!`
  updateStatus("Provider updated")
  refreshProviderList()
}

function editGeneralConfigInTui(): void {
  const { editGeneralConfig } = require("../commands/config")
  destroyViews()
  editGeneralConfig()
  setTimeout(() => {
    startInteractiveMode()
  }, 100)
}

async function handleGlobalKeyPress(key: any): Promise<void> {
  if (getIsInputMode() || getCurrentDialog()?.isOpen) {
    return
  }
  
  const renderer = getRenderer()
  if (!renderer) return

  const { configStore } = await import("../config/store")
  const providers = configStore.getProviders()
  const selectedIndex = getSelectedProviderIndex()

  switch (key.name) {
    case "a":
      startAddProviderFlow()
      break
    case "e":
      if (providers[selectedIndex - 1]) {
        editProviderInTui(providers[selectedIndex - 1])
      }
      break
    case "p":
      if (providers[selectedIndex - 1]) {
        testProviderInTui(providers[selectedIndex - 1])
      }
      break
    case "d":
      if (providers[selectedIndex - 1]) {
        deleteProviderInTui(providers[selectedIndex - 1])
      }
      break
    case "r":
      refreshProviderList()
      updateStatus("Refreshed")
      break
    case "q":
      destroyViews()
      process.exit(0)
      break
  }
}

async function startAddProviderFlow(): Promise<void> {
  const renderer = getRenderer()
  if (!renderer) return

  try {
    let defaults: ProviderFormDefaults = {}

    const useTemplate = await showConfirmDialog(
      "Use Provider Template",
      "Would you like to use a provider template?"
    )

    // If cancelled (Escape), return
    if (useTemplate === null) return

    // If Yes, select a template
    if (useTemplate === true) {
      const templateNames = getTemplateNames()
      const selectedTemplate = await showListDialog(
        "Select a Template",
        templateNames.map((name: string) => {
          const t = getTemplateByFullName(name)
          return { name: `${t?.name} - ${t?.description}`, value: name }
        })
      )

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

    // Continue with custom provider details (whether user chose Yes with template or No)

    const name = await showInputDialog("Enter Provider Name", "Proider Name", defaults.name || "", true)
    if (!name) return

    const website = await showInputDialog("Enter Website URL", "Website URL", defaults.website || "https://example.com")
    if (!website) return

    const baseUrl = await showInputDialog("Enter API Base URL", "API Base URL", defaults.baseUrl || "", true)
    if (!baseUrl) return

    const apiKey = await showInputDialog("Enter API Key", "API Key", "", true, true)
    if (!apiKey) return

    // Default to Anthropic Messages format
    const apiFormat = "anthropic-messages"

    const defaultModel = await showInputDialog("Default Model", "Default model name:", defaults.models?.default || "",true)
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
      apiFormat: apiFormat as "anthropic-messages" | "openai-completions",
      models: {
        default: defaultModel || undefined,
        haiku: haikuModel || undefined,
        opus: opusModel || undefined,
        sonnet: sonnetModel || undefined,
      },
    })

    refreshProviderList()

    const detailText = getDetailText()
    if (detailText) {
      detailText.content = `
✓ Provider "${provider.name}" added successfully!
Provider ID: ${provider.id}

Select a provider to view details.
`
    }

    updateStatus(`Provider "${provider.name}" added`)
  } finally {
    focusProviderSelect()
  }
}
