import { useState, useCallback } from "react"
import { useRenderer, useKeyboard } from "@opentui/react"
import { getThemeColors, layout } from "../../../utils/theme"

interface InputDialogProps {
  title: string
  message: string
  defaultValue?: string
  required?: boolean
  onClose: (result: string | null) => void
}

export function InputDialog({ title, message, defaultValue = "", required = false, onClose }: InputDialogProps) {
  const renderer = useRenderer()
  const colors = getThemeColors()
  const [value, setValue] = useState(defaultValue)

  const dialogWidth = layout.dialogMaxWidth
  const dialogHeight = 9
  const padding = 3
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2)
  const dialogTop = Math.floor((renderer.height - dialogHeight) / 2)

  const handleKey = useCallback((key: any) => {
    if (key.name === "escape") {
      onClose(null)
    } else if (key.name === "return") {
      const trimmed = value.trim()
      if (!required || trimmed !== "") {
        onClose(value)
      }
    }
  }, [value, onClose, required])

  useKeyboard(handleKey, { release: false })

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
        {/* <text
          position="absolute"
          left={padding}
          top={3}
        >
          {message}:
        </text> */}
        <input
          value={value}
          onInput={setValue}
          position="absolute"
          left={padding}
          top={4}
          width={dialogWidth - padding * 2 - 2}
          placeholder={defaultValue || "(empty)"}
          focused={true}
          textColor={colors.text}
          cursorColor={colors.textMuted}
          focusedTextColor={colors.text}
          placeholderColor={colors.textMuted}
          zIndex={202}
        />
        <text
          position="absolute"
          left={padding}
          top={dialogHeight - 2}
          fg={colors.textMuted}
        >
          <span fg={colors.textHighlight}>enter</span> to submit
        </text>
      </box>
    </>
  )
}
