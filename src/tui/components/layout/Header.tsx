import type { ThemeColors } from "../../utils/theme"
import type { CliTarget } from "../../../types"
import { VERSION } from "../../version"

interface HeaderProps {
  colors: ThemeColors
  version: string
  cliTarget?: CliTarget
}

export function Header({ colors, version, cliTarget }: HeaderProps) {
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
      {cliTarget && (
        <box
          position="absolute"
          top={4}
          right={3}
          backgroundColor={colors.primaryLight}
          paddingX={1}
          paddingY={0}
        >
          <text>
            <span fg={colors.text}>{cliTarget.toUpperCase()}</span>
          </text>
        </box>
      )}
    </>
  )
}
