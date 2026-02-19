import type { ThemeColors } from "../../utils/theme"
import type { Provider } from "../../types"

interface DetailPanelProps {
  content: {
    type: "default" | "provider" | "ping" | "message"
    provider?: Provider
    isActive?: boolean
    message?: string
    pingResult?: {
      success: boolean
      latency?: number
      timingBreakdown?: { dns?: string; connect?: string; ttfb?: string; api?: string }
      error?: string
    }
  } | null
  colors: ThemeColors
}

export function DetailPanel({ content, colors }: DetailPanelProps) {
  if (!content) {
    return (
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
  }

  if (content.type === "default") {
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
          {content.isActive && <span fg={colors.success}>✓ Active</span>}
        </text>
      </box>
    )
  }

  if (content.type === "provider" && content.provider) {
    const p = content.provider
    const defaultModel = p.models.default || "(not set)"
    const haikuModel = p.models.haiku || "(not set)"
    const opusModel = p.models.opus || "(not set)"
    const sonnetModel = p.models.sonnet || "(not set)"

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
          <strong fg={colors.primaryLight}>Name:</strong>     {p.name}
          {"\n"}
          <strong fg={colors.primaryLight}>Website:</strong>  {p.website}
          {"\n"}
          <strong fg={colors.primaryLight}>API URL:</strong>  {p.baseUrl}
          {"\n"}
          <strong fg={colors.primaryLight}>Format:</strong>   {p.apiFormat}
          {"\n"}
          {"\n"}
          <strong fg={colors.primaryLight}>Models:</strong>
          {"\n"}
          {"  "}<span fg={colors.textMuted}>Default:</span> {defaultModel}
          {"\n"}
          {"  "}<span fg={colors.textMuted}>Haiku:</span>   {haikuModel}
          {"\n"}
          {"  "}<span fg={colors.textMuted}>Opus:</span>    {opusModel}
          {"\n"}
          {"  "}<span fg={colors.textMuted}>Sonnet:</span>  {sonnetModel}
          {"\n"}
          {"\n"}
          {content.isActive && <span fg={colors.success}>✓ Active</span>}
        </text>
      </box>
    )
  }

  if (content.type === "ping" && content.pingResult) {
    const result = content.pingResult
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
          {result.success ? (
            <>
              <span fg={colors.success}>✓ Ping successful!</span>
              {"\n"}
              {"\n"}
              {"  "}Latency: <span fg={colors.success}>{result.latency}ms</span>
              {result.timingBreakdown && (
                <>
                  {"\n"}
                  {"    "}<span fg={colors.textMuted}>DNS:</span>   <span fg={colors.textHighlight}>{result.timingBreakdown.dns || "N/A"} ms</span>
                  {"\n"}
                  {"    "}<span fg={colors.textMuted}>CONN:</span>  <span fg={colors.textHighlight}>{result.timingBreakdown.connect || "N/A"} ms</span>
                  {"\n"}
                  {"    "}<span fg={colors.textMuted}>TTFB:</span>  <span fg={colors.textHighlight}>{result.timingBreakdown.ttfb || "N/A"} ms</span>
                  {"\n"}
                  {"    "}<span fg={colors.textMuted}>API:</span>   <span fg={colors.textHighlight}>{result.timingBreakdown.api || "N/A"} ms</span>
                </>
              )}
            </>
          ) : (
            <>
              <span fg={colors.error}>✗ Ping failed:</span> <span fg={colors.error}>{result.error || "Unknown error"}</span>
            </>
          )}
        </text>
      </box>
    )
  }

  if (content.type === "message" && content.message) {
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
          {content.message}
        </text>
      </box>
    )
  }

  return (
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
}
