import type { ThemeColors } from "../../utils/theme"
import { VERSION } from "../../version"

interface HeaderProps {
  colors: ThemeColors
  version: string
}

export function Header({ colors, version }: HeaderProps) {
  return (
    <>
      <box
        width="100%"
        height={6}
        backgroundColor={colors.primary}
        position="absolute"
        left={0}
        top={0}
      />
      <ascii-font
        text="Persona"
        font="tiny"
        color={colors.textMuted}
        position="absolute"
        top={2}
        left={3}
      />
      <text
        position="absolute"
        top={4}
        left={3}
      >
        <span fg={colors.textMuted}>AI Coding CLI Provider Manager</span>
      </text>
    </>
  )
}
