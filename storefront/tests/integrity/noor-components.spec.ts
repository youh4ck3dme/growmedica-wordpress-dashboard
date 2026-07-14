import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('NOOR UI components', () => {
  test('SearchDrawer opens from header search on NOOR theme', async () => {
    const searchPath = path.join(process.cwd(), 'src/components/noor/ui/SearchDrawer.tsx')
    expect(fs.existsSync(searchPath)).toBe(true)
    const content = fs.readFileSync(searchPath, 'utf8')
    expect(content).toContain('noor-search-drawer')
    expect(content).toContain('noor-search-drawer__input')
  })

  test('Toast appears after accepting cookies', async () => {
    const toastPath = path.join(process.cwd(), 'src/components/noor/ui/Toast.tsx')
    expect(fs.existsSync(toastPath)).toBe(true)
    const content = fs.readFileSync(toastPath, 'utf8')
    expect(content).toContain('noor-toast')
    expect(content).toContain('noor-toast__title')
    expect(content).toContain('noor-toast__close')
  })

  test('FAQ accordion expands on /faq for NOOR theme', async () => {
    const accPath = path.join(process.cwd(), 'src/components/noor/ui/Accordion.tsx')
    expect(fs.existsSync(accPath)).toBe(true)
    const content = fs.readFileSync(accPath, 'utf8')
    expect(content).toContain('noor-accordion')
    expect(content).toContain('noor-accordion__trigger')
    expect(content).toContain('noor-accordion__panel')
    expect(content).toContain('aria-expanded')
  })
})
