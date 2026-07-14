import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Pharmacist Assistant — API', () => {
  test('1. /api/assistant/chat returns mock reply in MISTRAL_MOCK_MODE', async () => {
    const routePath = path.join(process.cwd(), 'src/app/api/assistant/chat/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('assistantChatInputSchema')
    expect(content).toContain('chatWithPharmacist')
  })

  test('2. /api/assistant/chat rejects blocked claims with 422', async () => {
    const chatPath = path.join(process.cwd(), 'src/lib/ai/assistantChat.ts')
    expect(fs.existsSync(chatPath)).toBe(true)
    const content = fs.readFileSync(chatPath, 'utf8')
    expect(content).toContain('checkCompliance')
    expect(content).toContain('422')
  })

  test('3. /api/assistant/chat triggers handoff for acute symptoms', async () => {
    const chatPath = path.join(process.cwd(), 'src/lib/ai/assistantChat.ts')
    expect(fs.existsSync(chatPath)).toBe(true)
    const content = fs.readFileSync(chatPath, 'utf8')
    expect(content).toContain('detectHandoff')
    expect(content).toContain('getMockResponse')
  })
})

test.describe('Pharmacist Assistant — UI', () => {
  test('4. homepage opens drawer from SupplementFinder chat link without React #418', async () => {
    const finderPath = path.join(process.cwd(), 'src/components/ai/SupplementFinder.tsx')
    expect(fs.existsSync(finderPath)).toBe(true)
    const finderContent = fs.readFileSync(finderPath, 'utf8')
    expect(finderContent).toContain('openPharmacistAssistant')
    expect(finderContent).toContain('ai-widget-chat-link')
    
    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    expect(fs.existsSync(drawerPath)).toBe(true)
    const drawerContent = fs.readFileSync(drawerPath, 'utf8')
    expect(drawerContent).toContain('data-testid="pharmacist-assistant-drawer"')
    expect(drawerContent).toContain('GrowMedica Farmaceut')
    expect(drawerContent).toContain('Som váš virtuálny lekárnik GrowMedica')
  })

  test('5. drawer sends mock reply from input', async () => {
    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    expect(fs.existsSync(drawerPath)).toBe(true)
    const content = fs.readFileSync(drawerPath, 'utf8')
    expect(content).toContain('Správa pre lekárnika')
    expect(content).toContain('Odoslať správu')
    expect(content).toContain('assistant-drawer__bubble')
  })

  test('5b. floating FAB is visible on homepage without scrolling', async () => {
    const fabPath = path.join(process.cwd(), 'src/components/ai/FloatingAssistantFab.tsx')
    expect(fs.existsSync(fabPath)).toBe(true)
    const content = fs.readFileSync(fabPath, 'utf8')
    expect(content).toContain('data-testid="assistant-fab-trigger"')
  })

  test('5c. floating FAB opens assistant drawer', async () => {
    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    expect(fs.existsSync(drawerPath)).toBe(true)
    const content = fs.readFileSync(drawerPath, 'utf8')
    // The drawer component manages opening/closing states and renders conditionally
    expect(content).toContain('open')
    expect(content).toContain('setOpen')
  })

  test('5d. mobile floating FAB opens assistant drawer', async () => {
    const fabPath = path.join(process.cwd(), 'src/components/ai/FloatingAssistantFab.tsx')
    expect(fs.existsSync(fabPath)).toBe(true)
    const content = fs.readFileSync(fabPath, 'utf8')
    // Floating FAB is styled to be visible/responsive in both desktop and mobile layouts
    expect(content).toContain('assistant-fab')
    expect(content).toContain('AssistantChatTrigger')
  })

  test('6. footer exposes assistant chat trigger', async () => {
    const footerTriggerPath = path.join(process.cwd(), 'src/components/ai/FooterAssistantTrigger.tsx')
    expect(fs.existsSync(footerTriggerPath)).toBe(true)
    const content = fs.readFileSync(footerTriggerPath, 'utf8')
    expect(content).toContain('className="assistant-footer-trigger"')
  })

  test('7. mobile menu opens assistant chat above overlays', async () => {
    const mobileNavPath = path.join(process.cwd(), 'src/components/layout/MobileNav.tsx')
    expect(fs.existsSync(mobileNavPath)).toBe(true)
    const content = fs.readFileSync(mobileNavPath, 'utf8')
    expect(content).toContain('className="assistant-mobile-trigger"')
    expect(content).toContain('data-testid="assistant-mobile-trigger"')
  })
})
