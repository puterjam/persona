import { useState } from "react"
import { useRenderer, useKeyboard } from "@opentui/react"
import { getThemeColors, layout } from "../../../utils/theme"

interface ListDialogProps {
  title: string
  choices: { name: string; value: string }[]
  onClose: (result: string | null) => void
}

export function ListDialog({ title, choices, onClose }: ListDialogProps) {
  const renderer = useRenderer()
  const colors = getThemeColors()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const listHeight = Math.min(choices.length + 2, 10)
  const dialogHeight = listHeight + 6
  const dialogWidth = layout.dialogMaxWidth
  const padding = 3
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2)
  const dialogTop = Math.floor((renderer.height - dialogHeight) / 2)

  useKeyboard((key) => {
    if (key.name === "escape") {
      onClose(null)
    }
  }, { release: false })

  const options = choices.map((c) => ({
    name: c.name,
    description: "",
    value: c.value,
  }))

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
        <select
          options={options}
          selectedIndex={selectedIndex}
          onChange={(index) => setSelectedIndex(index)}
          onSelect={(index, option) => {
            if (option) {
              onClose(option.value)
            }
          }}
          position="absolute"
          left={padding}
          top={3}
          width={dialogWidth - padding * 2}
          height={listHeight}
          backgroundColor={colors.bgLight}
          focusedBackgroundColor={colors.bgLight}
          textColor={colors.text}
          selectedBackgroundColor={colors.selected}
          selectedTextColor={colors.selectedText}
          showDescription={false}
          focused={true}
          zIndex={202}
        />
        <text
          position="absolute"
          left={padding}
          top={dialogHeight - 2}
          fg={colors.textMuted}
        >
          <span fg={colors.textHighlight}>↑↓</span> to select, <span fg={colors.textHighlight}>enter</span> to confirm, <span fg={colors.textHighlight}>esc</span> to cancel
        </text>
      </box>
    </>
  )
}
