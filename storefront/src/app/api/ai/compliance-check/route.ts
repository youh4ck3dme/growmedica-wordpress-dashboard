import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callMistral } from '@/lib/ai/client'
import { AiError } from '@/lib/ai/errors'
import { getClientIp } from '@/lib/ai/request'
import { complianceCheckSchema } from '@/lib/ai/schemas'

const complianceCheckInputSchema = z.object({
  text: z.string().min(1).max(2000),
})

const COMPLIANCE_PROMPT_SCHEMA = `
Vráť IBA JSON objekt s nasledujúcou štruktúrou:
{
  "approved": true | false,
  "riskLevel": "low" | "medium" | "high",
  "blockedClaims": ["Zakázané tvrdenie 1"],
  "rewrite": "Upravená verzia textu",
  "notes": ["Poznámka 1"]
}
PRAVIDLÁ:
- approved: true len ak text spĺňa požiadavky nariadenia 1924/2006 (žiadne liečebné tvrdenia).
- riskLevel: "low" ak approved, inak "medium" alebo "high".
`

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { text } = complianceCheckInputSchema.parse(body)

    const prompt = `
Si compliance asistent pre e-shop so zdravotnými doplnkami GrowMedica.sk (SK trh, nariadenie 1924/2006).
${COMPLIANCE_PROMPT_SCHEMA}

Text na kontrolu: ${JSON.stringify(text)}
`

    const output = await callMistral(prompt, complianceCheckSchema, { ip })
    return NextResponse.json(output)
  } catch (error) {
    console.error('[AI Compliance] Error:', error)
    const message = error instanceof Error ? error.message : 'Nepodarilo sa skontrolovať text.'
    const status =
      error instanceof AiError ? error.status : error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
