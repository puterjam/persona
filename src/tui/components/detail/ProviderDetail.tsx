import type { Provider } from "../../../types"
import type { ThemeColors } from "../../../utils/theme"

interface ProviderDetailProps {
  provider: Provider
  isActive?: boolean
  colors: ThemeColors
}

export function ProviderDetail({ provider, isActive, colors }: ProviderDetailProps) {
  const defaultModel = provider.models.default || "(not set)"
  const haikuModel = provider.models.haiku || "(not set)"
  const opusModel = provider.models.opus || "(not set)"
  const sonnetModel = provider.models.sonnet || "(not set)"

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
        <strong fg={colors.primaryLight}>Name:</strong>     {provider.name}
        {"\n"}
        <strong fg={colors.primaryLight}>Website:</strong>  {provider.website}
        {"\n"}
        <strong fg={colors.primaryLight}>API URL:</strong>  {provider.baseUrl}
        {"\n"}
        <strong fg={colors.primaryLight}>Format:</strong>   {provider.apiFormat}
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
        {isActive && <span fg={colors.success}>✓ Active</span>}
      </text>
    </box>
  )
}
