import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { TuiApp } from "./components/App"
import { loadThemeFromConfig } from "../utils/theme"
import { configStore } from "../config/store"
import { Provider } from "../types"

export async function startInteractiveMode(): Promise<void> {
  loadThemeFromConfig()
  
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  })
    
  const root = createRoot(renderer)
  
  const cleanup = () => {
    renderer.stop()
    renderer.destroy()
  }
  
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
  
  root.render(<TuiApp renderer={renderer} />)
}
