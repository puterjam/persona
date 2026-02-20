import type { ThemeColors } from "../../utils/theme"
import type { DetailContent } from "./types/detail"
import { DefaultDetail } from "./detail/DefaultDetail"
import { ProviderDetail } from "./detail/ProviderDetail"
import { PingResultDetail } from "./detail/PingResultDetail"
import { MessageDetail } from "./detail/MessageDetail"

interface DetailPanelProps {
  content: DetailContent | null
  colors: ThemeColors
}

const EmptyDetail = ({ colors }: { colors: ThemeColors }) => (
  <box
    width="70%"
    height="100%"
    backgroundColor={colors.bg}
    flexGrow={1}
    padding={2}
    paddingLeft={5}
  >
    <text width="100%" height="100%"></text>
  </box>
)

export function DetailPanel({ content, colors }: DetailPanelProps) {
  if (!content) {
    return <EmptyDetail colors={colors} />
  }

  switch (content.type) {
    case "default":
      return <DefaultDetail isActive={content.isActive} colors={colors} />
    case "provider":
      if (!content.provider) return <EmptyDetail colors={colors} />
      return <ProviderDetail provider={content.provider} isActive={content.isActive} colors={colors} />
    case "ping":
      if (!content.pingResult) return <EmptyDetail colors={colors} />
      return <PingResultDetail result={content.pingResult} colors={colors} />
    case "message":
      if (!content.message) return <EmptyDetail colors={colors} />
      return <MessageDetail message={content.message} colors={colors} />
    default:
      return <EmptyDetail colors={colors} />
  }
}
