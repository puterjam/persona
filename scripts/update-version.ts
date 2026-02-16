import { readFileSync, writeFileSync } from "fs"

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"))
const version = packageJson.version

writeFileSync(
  "./src/version.ts",
  `export const VERSION = "${version}"\n`
)

console.log(`Version updated: ${version}`)
