import { Mistral } from '@mistralai/mistralai'
import { ASSISTANT_CART_HINT, PHARMACIST_PERSONA } from '@/lib/ai/prompts/pharmacist'
import {
  buildAssistantProductContext,
  detectHandoff,
  type AssistantChatMessage,
  type AssistantChatResponse,
  type AssistantProductContext,
} from '@/lib/ai/pharmacist-assistant'
import { SAFE_DISCLAIMER, checkCompliance } from '@/lib/ai/compliance'
import { getMistralEnv } from '@/lib/ai/env'
import { AiError } from '@/lib/ai/errors'
import { checkRateLimit } from '@/lib/ai/rateLimit'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const TIMEOUT_MS = 30_000

type ChatWithPharmacistInput = {
  messages: AssistantChatMessage[]
  conversationId?: string
  ip: string
}

function extractMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (typeof chunk === 'string') return chunk
        if (chunk && typeof chunk === 'object' && 'text' in chunk) {
          return String((chunk as { text?: string }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return ''
}

function isRetryableError(error: Error): boolean {
  if (error.name === 'AbortError') return true
  return /429|50[0-4]/.test(error.message)
}

function isAuthError(error: Error): boolean {
  return /401|403|unauthorized|forbidden|invalid api key/i.test(error.message)
}

function getLastUserMessage(messages: AssistantChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return messages[index].content.trim()
    }
  }
  return ''
}

function defaultSuggestedReplies(lastUser: string): string[] {
  const normalized = lastUser.toLowerCase()
  if (/objedn|kosik|platb/.test(normalized)) {
    return ['Ako dokončím objednávku?', 'Odporuč mi produkt na energiu', 'Kontakt na podporu']
  }
  if (/spánok|energi|tráven|imunit/.test(normalized)) {
    return ['Ukáž produkty v košíku', 'Čo odporúčate pre šport?', 'Prejsť na /kolekcie']
  }
  return ['Odporuč mi produkt na spánok', 'Ako dokončím objednávku?', 'Kontakt na podporu']
}

function getMockResponse(
  lastUser: string,
  productContext: AssistantProductContext[],
): AssistantChatResponse {
  const handoff = detectHandoff(lastUser)
  if (handoff) {
    return {
      message: `${handoff.message}\n\n${SAFE_DISCLAIMER}`,
      suggested_replies: ['Prejsť na kontakt', 'Odporuč mi produkt'],
      handoff,
    }
  }

  const productLine =
    productContext.length > 0
      ? `Z katalógu by som sa pozrel na ${productContext
          .slice(0, 2)
          .map((product) => product.title)
          .join(' alebo ')}.`
      : 'Pozrite si naše kolekcie na /kolekcie.'

  return {
    message: `${productLine} ${ASSISTANT_CART_HINT}\n\n${SAFE_DISCLAIMER}`,
    suggested_replies: defaultSuggestedReplies(lastUser),
    handoff: null,
  }
}

async function completeChatWithKey(
  apiKey: string,
  mistralMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
): Promise<string> {
  const client = new Mistral({ apiKey })
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await client.chat.complete(
      {
        model,
        messages: mistralMessages,
        temperature: 0.2,
      },
      { signal: controller.signal },
    )

    const rawContent = response.choices?.[0]?.message?.content
    const text = extractMessageContent(rawContent).trim()
    if (!text) {
      throw new Error('Mistral API: No content in response')
    }
    return text
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildMistralMessages(
  messages: AssistantChatMessage[],
  productContext: AssistantProductContext[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const catalogBlock =
    productContext.length > 0
      ? `\n\nDostupné produkty (odporúčaj len tieto, s presným názvom):\n${JSON.stringify(productContext)}`
      : ''

  const systemContent = `${PHARMACIST_PERSONA}\n\n${SAFE_DISCLAIMER}\n${ASSISTANT_CART_HINT}${catalogBlock}`

  const trimmed = messages.slice(-12)
  return [
    { role: 'system', content: systemContent },
    ...trimmed.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]
}

export async function chatWithPharmacist(input: ChatWithPharmacistInput): Promise<AssistantChatResponse> {
  const lastUser = getLastUserMessage(input.messages)
  if (!lastUser) {
    throw new AiError('Správa je prázdna.', 400)
  }

  const complianceIssues = checkCompliance(lastUser)
  if (complianceIssues.length > 0) {
    throw new AiError('Vstup obsahuje zakázané tvrdenia. Skúste to formulovať inak.', 422)
  }

  const rateLimit = await checkRateLimit(input.ip)
  if (!rateLimit.allowed) {
    throw new AiError('Príliš veľa požiadaviek. Skúste to prosím neskôr.', 429)
  }

  const handoff = detectHandoff(lastUser)
  const productContext = await buildAssistantProductContext(lastUser)

  if (process.env.MISTRAL_MOCK_MODE === '1') {
    return {
      ...getMockResponse(lastUser, productContext),
      conversation_id: input.conversationId ?? null,
    }
  }

  const { MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP, MISTRAL_MODEL } = getMistralEnv()
  const apiKeys = [MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP].filter(
    (key, index, keys): key is string => Boolean(key) && keys.indexOf(key) === index,
  )

  const mistralMessages = buildMistralMessages(input.messages, productContext)
  let lastError: Error | undefined
  let rendered = ''

  for (const apiKey of apiKeys) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        rendered = await completeChatWithKey(apiKey, mistralMessages, MISTRAL_MODEL)
        lastError = undefined
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (isAuthError(lastError) && apiKey !== apiKeys[apiKeys.length - 1]) {
          break
        }
        if (!isRetryableError(lastError) || attempt === MAX_RETRIES - 1) {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** attempt))
      }
    }
    if (rendered) break
    if (lastError && !isAuthError(lastError)) break
  }

  if (!rendered) {
    console.error('[Assistant] Mistral failed:', lastError?.message)
    throw new AiError('Chat je dočasne nedostupný. Skúste to prosím neskôr.', 503)
  }

  return {
    message: rendered,
    suggested_replies: defaultSuggestedReplies(lastUser),
    handoff,
    conversation_id: input.conversationId ?? null,
  }
}
