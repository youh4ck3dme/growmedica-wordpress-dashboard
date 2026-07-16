import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callMistral } from '@/lib/ai/client'
import { buildProductFitPromptContext } from '@/lib/ai/productFitContext'
import { SAFE_DISCLAIMER } from '@/lib/ai/compliance'
import { AiError } from '@/lib/ai/errors'
import { getClientIp } from '@/lib/ai/request'
import { productFitSchema } from '@/lib/ai/schemas'
import { getProductByHandle } from '@/lib/catalog/products'

const productFitInputSchema = z.object({
  handle: z.string().min(1),
  userContext: z.string().min(5).max(500),
})

const PRODUCT_FIT_PROMPT_SCHEMA = `
Si GrowMedica AI produktový asistent pre e-shop so zdravotnými doplnkami GrowMedica.cz (SK trh).

ÚLOHA:
Na základe konkrétneho produktu a používateľského cieľa vysvetli, či produkt dáva zmysel.

PRAVIDLÁ:
- Neposkytuj diagnózu.
- Nepíš zdravotné garancie.
- Nevymýšľaj informácie, ktoré nie sú v produktových dátach.
- Nikdy netvrd, že produkt lieči alebo diagnostikuje.
- Ak chýba usage alebo ingredients, neuvádzaj konkrétne dávkovanie ani zloženie — povedz to neutrálne.
- howToUse vychádzaj len z poskytnutého usage alebo popisu; ak usage chýba, odporuč postupovať podľa obalu/štítku.
- safeDisclaimer musí obsahovať: "${SAFE_DISCLAIMER}"

Vráť IBA JSON objekt s nasledujúcou štruktúrou:
{
  "fit": "good" | "maybe" | "not_recommended",
  "shortAnswer": "Krátka odpoveď (1-2 vety)",
  "bestFor": ["Skupina 1"],
  "notIdealFor": ["Skupina A"],
  "howToUse": "Stručný návod (max 2 vety)",
  "safeDisclaimer": "Disclaimer text"
}
`

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { handle, userContext } = productFitInputSchema.parse(body)

    const product = await getProductByHandle(handle)
    if (!product) {
      return NextResponse.json({ error: 'Produkt neexistuje.' }, { status: 404 })
    }

    const productContext = buildProductFitPromptContext(product)

    const prompt = `
${PRODUCT_FIT_PROMPT_SCHEMA}

Produktové dáta: ${JSON.stringify(productContext)}
Používateľov cieľ (userGoal): ${JSON.stringify(userContext)}
`

    const output = await callMistral(prompt, productFitSchema, { ip, userInput: userContext })
    return NextResponse.json(output)
  } catch (error) {
    console.error('[AI Product-Fit] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Nepodarilo sa posúdiť vhodnosť produktu.'
    const status =
      error instanceof AiError ? error.status : error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
