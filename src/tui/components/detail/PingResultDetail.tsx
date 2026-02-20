import type { PingResult } from "../types/detail"
import type { ThemeColors } from "../../../utils/theme"

interface PingResultDetailProps {
  result: PingResult
  colors: ThemeColors
}

export function PingResultDetail({ result, colors }: PingResultDetailProps) {
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
