import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  RenderableEvents,
  ASCIIFontRenderable,
  type CliRenderer,
  type SelectOption,
  t,
  bold,
  fg,
  ConsolePosition,
} from "@opentui/core"
import { Provider } from "../../types"
import { configStore } from "../../config/store"
import { getThemeColors, layout } from "../theme"
import { VERSION } from "../../version"

function getColors() {
  return getThemeColors()
}

let renderer: CliRenderer | null = null
let providerSelect: SelectRenderable | null = null
let listContainer: BoxRenderable | null = null
let detailContainer: BoxRenderable | null = null
let detailText: TextRenderable | null = null
let statusText: TextRenderable | null = null
let headerText: TextRenderable | null = null
let mainContainer: BoxRenderable | null = null

export function getRenderer() {
  return renderer
}

export function getProviderSelect() {
  return providerSelect
}

export function focusProviderSelect() {
  providerSelect?.focus()
}

export function blurProviderSelect() {
  providerSelect?.blur()
}

export function getDetailText() {
  return detailText
}

export function getStatusText() {
  return statusText
}

export async function initViews(): Promise<CliRenderer> {
  renderer = await createCliRenderer({
    exitOnCtrlC: true,
    consoleOptions: {
      position: ConsolePosition.TOP,
      sizePercent: layout.consoleHeightPercent,
      startInDebugMode: false,
      zIndex: 2000,
    }
  })

  renderer.setBackgroundColor(getColors().bg)

  createMainContainer()
  createHeader()
  createProviderList()
  createDetailPanel()
  createStatusBar()

  renderer.on("resize", () => {
    updateMainContainerPosition()
  })

  renderer.keyInput.on("keypress", (key: any) => {
    if (key.character === "～") {
      renderer!.console.toggle()
    }
  })

  return renderer
}

function createMainContainer(): void {
  if (!renderer) return

  const { height, top, width, left } = calculateMainContainerLayout()

  mainContainer = new BoxRenderable(renderer, {
    id: "main-container",
    width,
    height,
    flexDirection: "row",
    position: "relative",
    left,
    top
  })

  renderer.root.add(mainContainer)
}

function calculateMainContainerLayout(): { height: number; top: number; width: number; left: number } {
  if (!renderer) return { height: 0, top: 0, width: 0, left: 0 }

  const contentHeight = renderer.height - 6
  const containerHeight = Math.min(contentHeight, 20)
  const centerTop = Math.floor((contentHeight - containerHeight) / 2) + 3

  const containerWidth = Math.floor(renderer.width * 0.8)
  const centerLeft = Math.floor((renderer.width - containerWidth) / 2)

  return { height: containerHeight, top: centerTop+1, width: containerWidth, left: centerLeft }
}

function updateMainContainerPosition(): void {
  if (!renderer || !mainContainer) return

  const { height, top, width, left } = calculateMainContainerLayout()
  mainContainer.height = height
  mainContainer.top = top
  mainContainer.width = width
  mainContainer.left = left
  mainContainer.requestRender()
}

function createHeader(): void {
  if (!renderer) return

  const titleFont = new ASCIIFontRenderable(renderer, {
    id: "header-title",
    text: "Persona",
    font: "tiny",
    color: getColors().textMuted,
    position: "absolute",
    top: 2,
    left: 3,
    zIndex: 101,
  })

  headerText = new TextRenderable(renderer, {
    id: "header-subtitle",
    content: t`${fg(getColors().textMuted)("AI Coding CLI Provider Manager")}`,
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 4,
    left: 3,
    zIndex: 100,
  })

  const headerBg = new BoxRenderable(renderer, {
    id: "header-bg",
    width: "100%",
    height: 5,
    backgroundColor: getColors().primary,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 99,
  })

  renderer.root.add(headerBg)
  renderer.root.add(titleFont)
  renderer.root.add(headerText)
}

function createProviderList(): void {
  if (!renderer || !mainContainer) return

  listContainer = new BoxRenderable(renderer, {
    id: "list-container",
    width: "30%",
    height: "100%",
    backgroundColor: getColors().bgLight,
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: 2,
    paddingRight: 2,
    flexGrow: 0,
    flexShrink: 0,
    
    border:["right"],
    borderColor: getColors().border,
    borderStyle: "heavy",
  })

  const listOptions = {
    id: "provider-list",
    width: "100%",
    height: "100%",
    textColor: getColors().text,
    backgroundColor: "transparent",
    focusedBackgroundColor: "transparent",
    focusedTextColor: getColors().text,
    selectedBackgroundColor: getColors().selected,
    selectedTextColor: getColors().selectedText,
    descriptionColor: getColors().textMuted,
    showDescription: true,
    showScrollIndicator: true,
    wrapSelection: false,
    focusable: false,
  }

  providerSelect = new SelectRenderable(renderer, listOptions as any)

  providerSelect.on(SelectRenderableEvents.SELECTION_CHANGED, (index: number, option: SelectOption) => {
    const providers = configStore.getProviders()
    const activeProvider = configStore.getActiveProvider()
    if (index === 0) {
      showDefaultDetails()
      if (listContainer) {
        listContainer.borderColor = getColors().border
        listContainer.requestRender()
      }
    } else if (providers[index - 1]) {
      showProviderDetails(providers[index - 1])
      const isActive = activeProvider?.id === providers[index - 1].id
      if (listContainer) {
        listContainer.borderColor = isActive ? getColors().primaryLight : getColors().border
        listContainer.requestRender()
      }
    }
  })

  providerSelect.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number, option: SelectOption) => {
    const providers = configStore.getProviders()
    if (index === 0) {
      await switchToDefault()
    } else if (providers[index - 1]) {
      switchToProvider(providers[index - 1])
    }
  })

  providerSelect.on(RenderableEvents.FOCUSED, () => {
    updateStatus("↑↓ Navigate  Enter Switch  a Add  p Ping  d Delete  r Refresh  q Quit")
  })

  listContainer.add(providerSelect)
  mainContainer.add(listContainer)

  providerSelect.focus()
}

function createDetailPanel(): void {
  if (!renderer || !mainContainer) return

  detailContainer = new BoxRenderable(renderer, {
    id: "detail-container",
    width: "80%",
    height: "100%",
    backgroundColor: getColors().bg,
    flexGrow: 1,
    padding: 2,
    paddingLeft: 2+3
  })

  detailText = new TextRenderable(renderer, {
    id: "detail-text",
    content: "",
    width: "100%",
    height: "100%",
  })

  detailContainer.add(detailText)
  mainContainer.add(detailContainer)
}

function createStatusBar(): void {
  if (!renderer) return

  const statusBg = new BoxRenderable(renderer, {
    id: "status-bg",
    width: "100%",
    height: 3,
    backgroundColor: getColors().primary,
    position: "absolute",
    left: 0,
    bottom: 0,
    zIndex: 99,
  })

  const statusContainer = new BoxRenderable(renderer, {
    id: "status",
    width: "100%",
    height: 2,
    position: "absolute",
    left: 3,
    bottom: 0,
    zIndex: 100,
    flexDirection: "row",
    backgroundColor: getColors().primary,
  })

  const items = [
    { text: "↑↓", highlight: true },
    { text: " navigate  ", highlight: false },
    { text: "enter", highlight: true },
    { text: " switch  ", highlight: false },
    { text: "a/e/d", highlight: true },
    { text: " add/edit/del  ", highlight: false },
    { text: "p", highlight: true },
    { text: " ping  ", highlight: false },
    { text: "c", highlight: true },
    { text: " config  ", highlight: false },
    { text: "q", highlight: true },
    { text: " quit", highlight: false },
  ]

  for (const item of items) {
    const textEl = new TextRenderable(renderer, {
      content: item.text,
      fg: item.highlight ? getColors().textHighlight : getColors().textMuted,
    })
    statusContainer.add(textEl)
  }

  const versionText = new TextRenderable(renderer, {
    id: "version",
    content: `v${VERSION}`,
    fg: getColors().textMuted,
    position: "absolute",
    right: 7,
    zIndex: 101,
  })

  renderer.root.add(statusBg)
  renderer.root.add(statusContainer)
  statusContainer.add(versionText)
}

export function updateStatus(message: string): void {
  if (statusText) {
    statusText.content = t`${fg(getColors().textHighlight)(message)}`
  }
}

export function refreshProviderList(): void {
  const providers = configStore.getProviders()
  const activeProvider = configStore.getActiveProvider()
  const isDefaultActive = !activeProvider

  if (!providerSelect) return

  const options: SelectOption[] = [
    {
      name: isDefaultActive ? "(Default) ✓" : "(Default)",
      description: "Anthropic official",
      value: "default",
    },
    ...providers.map((p) => {
      const isActive = activeProvider?.id === p.id
      return {
        name: isActive ? `${p.name} ✓` : p.name,
        description: (p.models.default || ""),
        value: p.id,
      }
    }),
  ]

  providerSelect.options = options

  if (providers.length === 0) {
    showNoProvidersMessage()
    providerSelect.setSelectedIndex(0)
    showDefaultDetails()
  } else {
    providerSelect.setSelectedIndex(0)
    showDefaultDetails()
  }
}

function showNoProvidersMessage(): void {
  if (detailText) {
    detailText.content = t`${fg(getColors().textMuted)("No providers available. Press [a] to add a new provider.")}`
  }
}

function showDefaultDetails(): void {
  if (detailText) {
    const activeProvider = configStore.getActiveProvider()
    const isDefaultActive = !activeProvider
    detailText.content = t`${bold(fg(getColors().primaryLight)("Default (Official)"))}

${fg(getColors().textMuted)("Restore the official Anthropic configuration.")}
${fg(getColors().textMuted)("This will clear all custom provider settings.")}

${fg(getColors().success)(isDefaultActive ? "✓ Active" : "")}
`
  }
}

async function switchToDefault(): Promise<void> {
  try {
    configStore.clearProviderConfig()
    if (detailText) {
      detailText.content = buildDefaultContent("✓ Switched to Default (Official)")
    }
    refreshProviderList()
    updateStatus("Switched to Default (Official)")
  } catch (error: any) {
    if (detailText) {
      detailText.content = buildDefaultContent(`✗ Failed to switch: ${error.message}`)
    }
  }
}

function buildDefaultContent(extra?: string): any {
  const activeProvider = configStore.getActiveProvider()
  const isDefaultActive = !activeProvider

  return t`${bold(fg(getColors().primaryLight)("Default (Official)"))}

${fg(getColors().textMuted)("Restore the official Anthropic configuration.")}
${fg(getColors().textMuted)("This will clear all custom provider settings.")}

${fg(getColors().success)(extra || (isDefaultActive ? "✓ Active" : ""))}
`
}

function buildProviderDetailsContent(provider: Provider, extra?: string): any {
  const activeProvider = configStore.getActiveProvider()
  const isActive = activeProvider?.id === provider.id

  const defaultModel = provider.models.default || t`${fg(getColors().textMuted)("(not set)")}`
  const haikuModel = provider.models.haiku || t`${fg(getColors().textMuted)("(not set)")}`
  const opusModel = provider.models.opus || t`${fg(getColors().textMuted)("(not set)")}`
  const sonnetModel = provider.models.sonnet || t`${fg(getColors().textMuted)("(not set)")}`

  let content: any = ""


content = t`${bold(fg(getColors().primaryLight)("Name:"))}     ${provider.name}
${bold(fg(getColors().primaryLight)("Website:"))}  ${provider.website}
${bold(fg(getColors().primaryLight)("API URL:"))}  ${provider.baseUrl}
${bold(fg(getColors().primaryLight)("Format:"))}   ${provider.apiFormat}

${bold(fg(getColors().primaryLight)("Models:"))}
  ${fg(getColors().textMuted)("Default:")} ${defaultModel}
  ${fg(getColors().textMuted)("Haiku:")}   ${haikuModel}
  ${fg(getColors().textMuted)("Opus:")}    ${opusModel}
  ${fg(getColors().textMuted)("Sonnet:")}  ${sonnetModel}

${fg(getColors().success)(extra || (isActive ? "✓ Active" : ""))}
`

  return content
}

export function showProviderDetails(provider: Provider): void {
  if (!detailText) return
  detailText.content = buildProviderDetailsContent(provider)
}

export function switchToProvider(provider: Provider): void {
  try {
    configStore.applyProviderToClaude(provider, true)
    configStore.setActiveProvider(provider.id)

    const currentIndex = providerSelect?.getSelectedIndex() ?? 0
    
    refreshProviderList()
    
    const providers = configStore.getProviders()
    const providerIndex = currentIndex - 1
    if (providerSelect && providerIndex >= 0 && providerIndex < providers.length) {
      providerSelect.setSelectedIndex(currentIndex)
    }

    if (detailText) {
      detailText.content = buildProviderDetailsContent(providers[providerIndex], `✓ Active`)
    }
    updateStatus(`Switched to ${provider.name}`)
  } catch (error: any) {
    const currentIndex = providerSelect?.getSelectedIndex() ?? 0
    const providers = configStore.getProviders()
    const providerIndex = currentIndex - 1
    if (detailText) {
      detailText.content = buildProviderDetailsContent(providers[providerIndex], `✗ Failed to switch: ${error.message}`)
    }
  }
}

export function getSelectedProviderIndex(): number {
  return providerSelect?.getSelectedIndex() ?? 0
}

export function destroyViews(): void {
  if (renderer) {
    renderer.stop()
    renderer.destroy()
    renderer = null
  }
}
