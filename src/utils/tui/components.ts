import {
  BoxRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core"
import { t, bold, fg } from "@opentui/core"
import { getThemeColors } from "../theme"

export function getColors() {
  return getThemeColors()
}

export interface DialogOptions {
  title: string
  width?: number
  height: number
  padding?: number
}

export function createDialogOverlay(renderer: CliRenderer): BoxRenderable {
  return new BoxRenderable(renderer, {
    id: "dialog-overlay",
    width: "100%",
    height: "100%",
    backgroundColor: getColors().overlay,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 200,
  })
}

export function createDialogBase(
  renderer: CliRenderer,
  options: DialogOptions
): { dialog: BoxRenderable; contentTop: number } {
  const { title, width = 50, height, padding = 2 } = options

  const dialogWidth = width
  const dialogHeight = height
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2)
  const dialogTop = Math.floor((renderer.height - dialogHeight) / 2)

  const dialog = new BoxRenderable(renderer, {
    id: "dialog",
    width: dialogWidth,
    height: dialogHeight,
    position: "absolute",
    left: dialogLeft,
    top: dialogTop,
    backgroundColor: getColors().bgLight,
    shouldFill: true,
    padding: padding,
    zIndex: 201,
  })

  const titleText = new TextRenderable(renderer, {
    id: "dialog-title",
    content: t`${bold(fg(getColors().dialogText)(title))}`,
    width: dialogWidth - (padding * 2) - 10,
    position: "absolute",
    left: padding,
    top: 1,
    zIndex: 202,
  })

  const escHint = new TextRenderable(renderer, {
    id: "dialog-esc-hint",
    content: t`${fg(getColors().textMuted)("Esc")}`,
    width: 10,
    position: "absolute",
    right: padding-6,
    top: 1,
    zIndex: 202,
  })

  dialog.add(titleText)
  dialog.add(escHint)

  return { dialog, contentTop: padding + 2 }
}

export function createButton(
  renderer: CliRenderer,
  text: string,
  isSelected: boolean,
  width: number = 10
): { container: BoxRenderable; text: TextRenderable } {
  const container = new BoxRenderable(renderer, {
    id: `button-${text.toLowerCase()}`,
    width,
    height: 1,
    backgroundColor: isSelected ? getColors().selected : getColors().bgLight,
    shouldFill: true,
    zIndex: 203,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  })

  const textEl = new TextRenderable(renderer, {
    id: `button-text-${text.toLowerCase()}`,
    content: text,
    fg: isSelected ? getColors().selectedText : getColors().text,
    zIndex: 204,
  })

  container.add(textEl)
  return { container, text: textEl }
}

export function updateButtonStyle(
  container: BoxRenderable,
  text: TextRenderable,
  isSelected: boolean
): void {
  container.backgroundColor = isSelected ? getColors().selected : getColors().bgLight
  text.fg = isSelected ? getColors().selectedText : getColors().text
}

export function createHintText(
  renderer: CliRenderer,
  content: string,
  width: number,
  top: number,
  padding: number = 2
): BoxRenderable {
  const keys = ["Enter", "Esc", "↑", "↓", "←", "→"]
  
  const container = new BoxRenderable(renderer, {
    id: "dialog-hint",
    width,
    height: 1,
    position: "absolute",
    left: padding,
    top,
    zIndex: 202,
    flexDirection: "row",
  })
  
  let lastEnd = 0
  let left = 0
  
  for (const key of keys) {
    const lowerText = content.toLowerCase()
    const idx = lowerText.indexOf(key.toLowerCase())
    if (idx !== -1 && idx >= lastEnd) {
      if (idx > lastEnd) {
        const plainText = content.slice(lastEnd, idx)
        const textEl = new TextRenderable(renderer, {
          content: plainText,
          fg: getColors().textMuted,
        })
        container.add(textEl)
        left += plainText.length
      }
      
      const textEl = new TextRenderable(renderer, {
        content: key,
        fg: getColors().textHighlight,
      })
      container.add(textEl)
      left += key.length
      lastEnd = idx + key.length
    }
  }
  
  if (lastEnd < content.length) {
    const textEl = new TextRenderable(renderer, {
      content: content.slice(lastEnd),
      fg: getColors().textMuted,
    })
    container.add(textEl)
  }
  
  return container as any
}
