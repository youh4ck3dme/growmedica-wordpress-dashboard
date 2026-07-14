import fs from 'fs'
import path from 'path'

const GLOBALS_CSS_PATH = path.join(__dirname, '../../src/styles/globals.css')

export function readGlobalsCss(): string {
  return fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8')
}

export function getCssVarFromSource(css: string, varName: string): string | null {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*:\\s*([^;\\n]+)`, 'i'))
  return match?.[1]?.trim() ?? null
}

export function cssUsesPrimaryToken(css: string, selector: string): boolean {
  const blockMatch = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 's'))
  if (!blockMatch) return false
  return blockMatch[1].includes('var(--color-primary)')
}
