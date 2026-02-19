import * as fs from 'fs';
import * as path from 'path';

export function findWorkDir(subDir: string): string | null {
  const cwd = process.cwd();
  const cwdPath = path.join(cwd, subDir);
  if (fs.existsSync(cwdPath) && fs.statSync(cwdPath).isDirectory()) {
    return cwdPath;
  }
  
  const personaRoot = process.env.PERSONA_ROOT;
  if (personaRoot) {
    const envPath = path.join(personaRoot, subDir);
    if (fs.existsSync(envPath) && fs.statSync(envPath).isDirectory()) {
      return envPath;
    }
  }
  return null;
}
