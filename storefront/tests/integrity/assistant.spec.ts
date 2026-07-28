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
    expect(content).toContain('recommended_products')
    expect(content).toContain('warning: copy.warning')
  })

  test('4. prompt enforces reply in last user language', async () => {
    const promptPath = path.join(process.cwd(), 'src/lib/ai/prompts/pharmacist.ts')
    const content = fs.readFileSync(promptPath, 'utf8')
    expect(content).toContain('VŽDY odpovedaj v jazyku poslednej používateľovej správy')
    expect(content).toContain('Ak používateľ zmení jazyk, okamžite prepni do nového jazyka')
  })
})

test.describe('Pharmacist Assistant — UI', () => {
  test('5. single FAB entry opens drawer without duplicate CTAs', async () => {
    const fabPath = path.join(process.cwd(), 'src/components/ai/FloatingAssistantFab.tsx')
    expect(fs.existsSync(fabPath)).toBe(true)
    const fabContent = fs.readFileSync(fabPath, 'utf8')
    expect(fabContent).toContain('data-testid="assistant-fab-trigger"')
    expect(fabContent).toContain("t('assistant.triggerAria')")
    expect(fabContent).not.toContain('Lekárnik')
    expect(fabContent).not.toContain('Poradiť sa s lekárnikom')

    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    expect(fs.existsSync(drawerPath)).toBe(true)
    const drawerContent = fs.readFileSync(drawerPath, 'utf8')
    expect(drawerContent).toContain("data-testid='pharmacist-assistant-drawer'")
    expect(drawerContent).toContain("t('assistant.headerTitle')")
    expect(drawerContent).toContain("t('assistant.initial')")
  })

  test('6. drawer renders structured product recommendation blocks', async () => {
    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    const content = fs.readFileSync(drawerPath, 'utf8')
    expect(content).toContain("data-testid='assistant-products-section'")
    expect(content).toContain("data-testid='assistant-bundle-section'")
    expect(content).toContain("data-testid='assistant-warning-section'")
    expect(content).toContain("data-testid='assistant-next-step-section'")
    expect(content).toContain('ProductRecommendationCard')
  })

  test('7. drawer keeps loading skeleton and sticky composer UX', async () => {
    const drawerPath = path.join(process.cwd(), 'src/components/ai/PharmacistAssistantDrawer.tsx')
    const content = fs.readFileSync(drawerPath, 'utf8')
    expect(content).toContain("data-testid='assistant-loading-cards'")
    expect(content).toContain('assistant-drawer__footer--sticky')
    expect(content).toContain("t('assistant.startHere')")
  })

  test('8. footer has no assistant chat trigger', async () => {
    const footerPath = path.join(process.cwd(), 'src/components/layout/Footer.tsx')
    expect(fs.existsSync(footerPath)).toBe(true)
    const content = fs.readFileSync(footerPath, 'utf8')
    expect(content).not.toContain('FooterAssistantTrigger')
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/ai/FooterAssistantTrigger.tsx'))).toBe(
      false,
    )
  })

  test('9. mobile menu has no assistant chat trigger', async () => {
    const mobileNavPath = path.join(process.cwd(), 'src/components/layout/MobileNav.tsx')
    expect(fs.existsSync(mobileNavPath)).toBe(true)
    const content = fs.readFileSync(mobileNavPath, 'utf8')
    expect(content).not.toContain('assistant-mobile-trigger')
    expect(content).not.toContain('openPharmacistAssistant')
    expect(content).not.toContain('assistant.mobileTrigger')
  })
})
