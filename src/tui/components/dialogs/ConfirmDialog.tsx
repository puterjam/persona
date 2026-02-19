import { useState } from "react"
import { useRenderer, useKeyboard } from "@opentui/react"
import { getThemeColors, layout } from "../../../utils/theme"

interface ConfirmDialogProps {
  title: string
  message: string
  onClose: (result: boolean | null) => void
}

export function ConfirmDialog({ title, message, onClose }: ConfirmDialogProps) {
  const renderer = useRenderer()
  const colors = getThemeColors()
  const [selectedButton, setSelectedButton] = useState(0)

  const dialogWidth = layout.dialogMinWidth
  const dialogHeight = 9
  const padding = 2
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2)
  const dialogTop = Math.floor((renderer.height - dialogHeight) / 2)

  useKeyboard((key) => {
    if (key.name === "left" || key.name === "right") {
      setSelectedButton((prev) => (prev === 0 ? 1 : 0))
    } else if (key.name === "return") {
      onClose(selectedButton === 0)
    } else if (key.name === "escape") {
      onClose(null)
    }
  }, { release: false })

  return (
    <>
      <box
        width="100%"
        height="100%"
        backgroundColor={colors.overlay}
        position="absolute"
        left={0}
        top={0}
        zIndex={200}
      />
      <box
        width={dialogWidth}
        height={dialogHeight}
        backgroundColor={colors.bgLight}
        position="absolute"
        left={dialogLeft}
        top={dialogTop}
        padding={padding}
        zIndex={201}
      >
        <text
          position="absolute"
          left={padding}
          top={1}
          zIndex={202}
        >
          <strong>{title}</strong>
        </text>
        <text
          position="absolute"
          right={padding}
          top={1}
          zIndex={202}
        >
          <span fg={colors.textMuted}>esc</span>
        </text>
        <text
          position="absolute"
          left={padding}
          top={3}
          width={dialogWidth - padding * 2}
        >
          {message}
        </text>
        <box
          position="absolute"
          left={padding}
          top={5}
          width={dialogWidth - padding * 2}
          height={1}
          flexDirection="row"
          justifyContent="center"
          gap={4}
        >
          <box
            width={10}
            height={1}
            backgroundColor={selectedButton === 0 ? colors.selected : colors.bgLight}
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <text fg={selectedButton === 0 ? colors.selectedText : colors.text}>Yes</text>
          </box>
          <box
            width={10}
            height={1}
            backgroundColor={selectedButton === 1 ? colors.selected : colors.bgLight}
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <text fg={selectedButton === 1 ? colors.selectedText : colors.text}>No</text>
          </box>
        </box>
      </box>
    </>
  )
}
