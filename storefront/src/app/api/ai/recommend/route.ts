import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callMistral } from '@/lib/ai/client'
import { buildProductSummaries, getRecommendContext } from '@/lib/ai/context'
import { SAFE_DISCLAIMER } from '@/lib/ai/compliance'
import { AiError } from '@/lib/ai/errors'
import { getClientIp } from '@/lib/ai/request'
import { recommendSchema } from '@/lib/ai/schemas'

const recommendInputSchema = z.object({
  userInput: z.string().min(10).max(1000),
})

const RECOMMEND_PROMPT_SCHEMA = `
Vráť IBA JSON objekt s nasledujúcou štruktúrou:
{
  "summary": "Krátke zhrnutie odporúčania (1-2 vety)",
  "recommendedHandles": ["handle-produktu-1", "handle-produktu-2"],
  "recommendedCategories": ["kategória-1"],
  "reasoningForUser": "Vysvetlenie pre používateľa (2-3 vety). Zahrni disclaimer.",
  "warnings": ["Upozornenie 1"],
  "bundleSuggestion": { "title": "Názov balíčka", "handles": ["handle-1"], "cta": "Text CTA" } | null
}
PRAVIDLÁ:
- Odporúčaj IBA produkty z poskytnutého zoznamu (presné handle).
- Ak nič nesedí, vráť prázdne polia a vysvetli to v reasoningForUser.
- Nikdy neodporúčaj produkty pre liečbu alebo diagnostiku.
- Nikdy negarantuj zdravotné výsledky.
- Disclaimer: "${SAFE_DISCLAIMER}"
`

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { userInput } = recommendInputSchema.parse(body)

    const { products, categories } = await getRecommendContext({ limit: 60 })

    const prompt = `
Si pomocník pre e-shop so zdravotnými doplnkami GrowMedica.sk (SK trh).
${RECOMMEND_PROMPT_SCHEMA}

Dostupné produkty: ${JSON.stringify(products)}
Dostupné kategórie: ${JSON.stringify(categories)}

Používateľov vstup: ${JSON.stringify(userInput)}
`

    const output = await callMistral(prompt, recommendSchema, { ip, userInput })

    const validHandles = new Set(products.map((product) => product.handle))
    output.recommendedHandles = output.recommendedHandles.filter((handle) =>
      validHandles.has(handle),
    )

    if (output.bundleSuggestion) {
      output.bundleSuggestion.handles = output.bundleSuggestion.handles.filter((handle) =>
        validHandles.has(handle),
      )
      if (output.bundleSuggestion.handles.length === 0) {
        output.bundleSuggestion = null
      }
    }

    return NextResponse.json({
      ...output,
      recommendedProducts: buildProductSummaries(output.recommendedHandles, products),
      bundleProducts: output.bundleSuggestion
        ? buildProductSummaries(output.bundleSuggestion.handles, products)
        : [],
    })
  } catch (error) {
    console.error('[AI Recommend] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Nepodarilo sa vygenerovať odporúčania.'
    const status =
      error instanceof AiError ? error.status : error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
