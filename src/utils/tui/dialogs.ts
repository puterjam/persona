import {
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  InputRenderableEvents,
  type CliRenderer,
  type SelectOption,
} from "@opentui/core"
import { t } from "@opentui/core"
import {
  createDialogOverlay,
  createDialogBase,
  createButton,
  updateButtonStyle,
  createHintText,
  colors,
} from "./components"
import { blurProviderSelect, focusProviderSelect } from "./views"

let currentDialog: { isOpen: boolean; close: () => void } | null = null
let isInputMode = false
let renderer: CliRenderer | null = null

export function setRenderer(r: CliRenderer): void {
  renderer = r
}

export function getCurrentDialog() {
  return currentDialog
}

export function getIsInputMode() {
  return isInputMode
}

export async function showConfirmDialog(
  title: string,
  message: string
): Promise<boolean> {
  console.log('[DEBUG] showConfirmDialog called:', title, message)
  return new Promise((resolve) => {
    if (!renderer) {
      resolve(false)
      return
    }

    const dialogWidth = 50
    const dialogHeight = 9
    const padding = 2

    const overlay = createDialogOverlay(renderer)
    const { dialog, contentTop } = createDialogBase(renderer, {
      title,
      width: dialogWidth,
      height: dialogHeight,
      padding,
    })

    const messageText = new TextRenderable(renderer, {
      id: "dialog-message",
      content: message,
      width: dialogWidth - padding * 2,
      height: 3,
      position: "absolute",
      left: padding,
      top: contentTop,
      zIndex: 202,
    })

    const buttonContainer = new BoxRenderable(renderer, {
      id: "button-container",
      width: dialogWidth - padding * 2,
      height: 1,
      backgroundColor: colors.bgLight,
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
      position: "absolute",
      left: padding,
      top: contentTop + 3,
      shouldFill: true,
      zIndex: 202,
    })

    const yesBtn = createButton(renderer, "Yes", true, 10)
    const noBtn = createButton(renderer, "No", false, 10)

    buttonContainer.add(yesBtn.container)
    buttonContainer.add(noBtn.container)

    renderer.root.add(overlay)
    renderer.root.add(dialog)
    dialog.add(messageText)
    dialog.add(buttonContainer)

    let selectedButton = 0

    const updateButtonStyles = () => {
      updateButtonStyle(yesBtn.container, yesBtn.text, selectedButton === 0)
      updateButtonStyle(noBtn.container, noBtn.text, selectedButton === 1)
    }

    updateButtonStyles()

    const closeDialog = () => {
      renderer!.root.remove("dialog")
      renderer!.root.remove("dialog-overlay")
      currentDialog = null
      isInputMode = false
      focusProviderSelect()
    }

    currentDialog = {
      isOpen: true,
      close: closeDialog,
    }

    isInputMode = true
    console.log('[DEBUG] showConfirmDialog: isInputMode set to true')
    blurProviderSelect()

    const keyHandler = (k: any) => {
      if (k.name === "left" || k.name === "right") {
        selectedButton = selectedButton === 0 ? 1 : 0
        updateButtonStyles()
      } else if (k.name === "return") {
        renderer!.keyInput.off("keypress", keyHandler)
        closeDialog()
        resolve(selectedButton === 0)
      } else if (k.name === "escape") {
        renderer!.keyInput.off("keypress", keyHandler)
        closeDialog()
        resolve(false)
      }
    }

    renderer.keyInput.on("keypress", keyHandler)
  })
}

export async function showInputDialog(
  title: string,
  message: string,
  defaultValue: string = "",
  required: boolean = false,
  password: boolean = false
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!renderer) {
      resolve(null)
      return
    }

    const dialogWidth = 60
    const dialogHeight = 9
    const padding = 2

    const overlay = createDialogOverlay(renderer)
    const { dialog, contentTop } = createDialogBase(renderer, {
      title,
      width: dialogWidth,
      height: dialogHeight,
      padding,
    })

    // const messageText = new TextRenderable(renderer, {
    //   id: "dialog-message",
    //   content: message,
    //   width: dialogWidth - padding * 2,
    //   position: "absolute",
    //   left: padding,
    //   top: contentTop,
    //   zIndex: 202,
    // })

    const input = new InputRenderable(renderer, {
      id: "dialog-input",
      width: dialogWidth - padding * 2 - 2,
      value: defaultValue,
      position: "absolute",
      placeholder:message,
      left: padding,
      top: contentTop,
      zIndex: 202,
      focusedBackgroundColor: colors.bg,
    })

    const hintText = createHintText(
      renderer,
      "Enter to confirm, Esc to cancel",
      dialogWidth - padding * 2,
      dialogHeight - padding ,
      padding
    )

    renderer.root.add(overlay)
    renderer.root.add(dialog)
    // dialog.add(messageText)
    dialog.add(input)
    dialog.add(hintText)

    isInputMode = true
    blurProviderSelect()
    input.focus()

    const closeDialog = () => {
      renderer!.root.remove("dialog")
      renderer!.root.remove("dialog-overlay")
      isInputMode = false
      currentDialog = null
      focusProviderSelect()
    }

    currentDialog = {
      isOpen: true,
      close: closeDialog,
    }

    input.on(InputRenderableEvents.ENTER, (value: string) => {
      const trimmed = value.trim()
      if (required && !trimmed) {
        input.focus()
        return
      }
      closeDialog()
      resolve(trimmed || defaultValue)
    })

    const escapeHandler = (key: any) => {
      if (key.name === "escape") {
        renderer!.keyInput.off("keypress", escapeHandler)
        closeDialog()
        resolve(null)
      }
    }

    renderer.keyInput.on("keypress", escapeHandler)
  })
}

export async function showListDialog(
  title: string,
  choices: { name: string; value: string }[],
  defaultValue?: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!renderer) {
      resolve(null)
      return
    }

    const listHeight = Math.min(choices.length + 2, 10)
    const dialogHeight = listHeight + 6
    const dialogWidth = 60
    const padding = 2

    const overlay = createDialogOverlay(renderer)
    const { dialog, contentTop } = createDialogBase(renderer, {
      title,
      width: dialogWidth,
      height: dialogHeight,
      padding,
    })

    const selectOptions: SelectOption[] = choices.map((c) => ({
      name: c.name,
      description: "",
      value: c.value,
    }))

    const listWidth = dialogWidth - padding * 2

    let defaultIndex = 0
    if (defaultValue) {
      const idx = choices.findIndex((c) => c.value === defaultValue)
      if (idx >= 0) defaultIndex = idx
    }

    const select = new SelectRenderable(renderer, {
      id: "list-select",
      width: listWidth,
      height: listHeight,
      position: "absolute",
      left: padding,
      top: contentTop -1,
      backgroundColor: colors.bgLight,
      focusedBackgroundColor: colors.bgLight,
      textColor: colors.text,
      focusedTextColor: colors.text,
      selectedBackgroundColor: colors.selected,
      selectedTextColor: colors.selectedText,
      showDescription: false,
      showScrollIndicator: false,
      wrapSelection: false,
      zIndex: 202,
      options: selectOptions,
      selectedIndex: defaultIndex,
    } as any)

    const hintText = createHintText(
      renderer,
      "↑↓ to select, Enter to confirm, Esc to cancel",
      dialogWidth - padding * 2,
      dialogHeight - padding,
      padding
    )

    renderer.root.add(overlay)
    renderer.root.add(dialog)
    dialog.add(select)
    dialog.add(hintText)

    currentDialog = {
      isOpen: true,
      close: () => {
        renderer!.root.remove("dialog")
        renderer!.root.remove("dialog-overlay")
        currentDialog = null
        isInputMode = false
      },
    }

    isInputMode = true
    blurProviderSelect()

    select.focus()

    select.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
      currentDialog?.close()
      resolve(option.value)
    })

    const keyHandler = (key: any) => {
      if (key.name === "escape") {
        renderer!.keyInput.off("keypress", keyHandler)
        currentDialog?.close()
        resolve(null)
      }
    }

    renderer.keyInput.on("keypress", keyHandler)
  })
}
