import type { ThemeColors } from "../../../utils/theme"

interface DefaultDetailProps {
  isActive?: boolean
  colors: ThemeColors
}

export function DefaultDetail({ isActive, colors }: DefaultDetailProps) {
  return (
    <box
      width="70%"
      height="100%"
      backgroundColor={colors.bg}
      flexGrow={1}
      padding={2}
      paddingLeft={5}
    >
      <text width="100%" height="100%">
        <strong fg={colors.primaryLight}>Default (Official)</strong>
        {"\n"}
        {"\n"}
        <span fg={colors.textMuted}>Restore the official Anthropic configuration.</span>
        {"\n"}
        <span fg={colors.textMuted}>This will clear all custom provider settings.</span>
        {"\n"}
        {"\n"}
        {isActive && <span fg={colors.success}>✓ Active</span>}
      </text>
    </box>
  )
}
