import type { ThemeColors } from "../../../utils/theme"

interface MessageDetailProps {
  message: string
  colors: ThemeColors
}

export function MessageDetail({ message, colors }: MessageDetailProps) {
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
        {message}
      </text>
    </box>
  )
}
