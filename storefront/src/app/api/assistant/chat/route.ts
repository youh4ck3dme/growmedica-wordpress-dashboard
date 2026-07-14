import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chatWithPharmacist } from '@/lib/ai/assistantChat'
import { AiError } from '@/lib/ai/errors'
import { getClientIp } from '@/lib/ai/request'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

const assistantChatInputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(24),
  conversation_id: z.string().max(128).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { messages, conversation_id: conversationId } = assistantChatInputSchema.parse(body)

    const response = await chatWithPharmacist({
      messages,
      conversationId,
      ip,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Assistant Chat] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Nepodarilo sa spracovať správu.'
    const status =
      error instanceof AiError ? error.status : error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
