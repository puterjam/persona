import type { ThemeColors } from "../../utils/theme"

interface StatusBarProps {
  message: string
  colors: ThemeColors
  version: string
}

function renderMessage(message: string, highlightColor: string) {
  const parts: { text: string; highlight: boolean }[] = []
  const regex = /\{([^}]+)\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: message.slice(lastIndex, match.index), highlight: false })
    }
    parts.push({ text: match[1], highlight: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < message.length) {
    parts.push({ text: message.slice(lastIndex), highlight: false })
  }

  return parts
}

export function StatusBar({ message, colors, version }: StatusBarProps) {
  const parts = renderMessage(message, colors.textHighlight)

  return (
    <>
      <box
        width="100%"
        height={3}
        backgroundColor={colors.primary}
        position="absolute"
        left={0}
        bottom={0}
        
      />
      <text
        position="absolute"
        left={3}
        bottom={0}
        paddingBottom={1}
        fg={colors.textMuted}
      >
        {parts.map((part, i) => (
          part.highlight 
            ? <span key={i} fg={colors.textHighlight}>{part.text}</span>
            : <span key={i}>{part.text}</span>
        ))}
      </text>
      <text
        position="absolute"
        right={3}
        bottom={0}
        paddingBottom={1}
        fg={colors.textMuted}
      >
        v{version}
      </text>
    </>
  )
}
