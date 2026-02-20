import type { Provider } from "../../types"

export interface PingResult {
  success: boolean
  latency?: number
  timingBreakdown?: {
    dns?: string
    connect?: string
    ttfb?: string
    api?: string
  }
  error?: string
}

export interface DetailContent {
  type: "default" | "provider" | "ping" | "message"
  provider?: Provider
  isActive?: boolean
  message?: string
  pingResult?: PingResult
}
