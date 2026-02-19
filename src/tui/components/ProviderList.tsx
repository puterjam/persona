import type { SelectOption } from "@opentui/core"
import type { ThemeColors } from "../../utils/theme"

interface ProviderListProps {
  options: SelectOption[]
  selectedIndex: number
  focused: boolean
  borderColor: string
  colors: ThemeColors
  onChange: (index: number, option: any) => void
  onSelect: (index: number, option: any) => void
}

export function ProviderList({ 
  options, 
  selectedIndex, 
  focused, 
  borderColor, 
  colors,
  onChange,
  onSelect 
}: ProviderListProps) {
  return (
    <box
      width="30%"
      height="100%"
      left={-1}
      flexGrow={0}
      flexShrink={0}
      paddingX={2}
      paddingY={1}
      backgroundColor={colors.bgLight}
      border={["right"]}
      borderColor={borderColor}
      borderStyle="heavy"
    >
      <select
        options={options}
        width="100%"
        height="100%"
        selectedIndex={selectedIndex}
        onChange={onChange}
        onSelect={onSelect}
        focused={focused}
        textColor={colors.text}
        backgroundColor="transparent"
        focusedBackgroundColor="transparent"
        focusedTextColor={colors.text}
        selectedBackgroundColor={colors.selected}
        selectedTextColor={colors.selectedText}
        descriptionColor={colors.textMuted}
        showDescription={true}
        showScrollIndicator={true}
        wrapSelection={false}
      />
    </box>
  )
}
