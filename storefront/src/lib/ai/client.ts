import { checkCompliance } from '@/lib/ai/compliance'
import { getMistralEnv } from '@/lib/ai/env'
import { AiError } from '@/lib/ai/errors'
import { mistralChatComplete } from '@/lib/ai/mistralHttp'
import { checkRateLimit } from '@/lib/ai/rateLimit'

import type { z } from 'zod'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const TIMEOUT_MS = 30_000

type MistralOptions = {
  model?: string
  temperature?: number
  ip?: string
  /** Only user-facing text — not full prompt with catalog JSON */
  userInput?: string
}

function getMockMistralOutput<T>(prompt: string, schema: z.ZodSchema<T>): T {
  if (prompt.includes('"approved"') && prompt.includes('"riskLevel"')) {
    const blocked = /vylieči|rakovinu|nahradí|lekára|liek/i.test(prompt)
    return schema.parse({
      approved: !blocked,
      riskLevel: blocked ? 'high' : 'low',
      blockedClaims: blocked ? ['liečebné tvrdenie'] : [],
      rewrite: blocked
        ? 'Produkt je výživový doplnok a nenahrádza odbornú zdravotnú starostlivosť.'
        : 'Text je vhodný pre bežnú produktovú komunikáciu.',
      notes: blocked ? ['Vyhnite sa tvrdeniam o liečbe.'] : [],
    })
  }

  if (prompt.includes('"fit"') && prompt.includes('"shortAnswer"')) {
    return schema.parse({
      fit: 'maybe',
      shortAnswer: 'Produkt môže byť vhodný podľa vašich cieľov, no berte ho ako doplnok stravy.',
      bestFor: ['aktívny životný štýl', 'bežné doplnenie stravy'],
      notIdealFor: ['tehotné ženy bez konzultácie', 'ľudia s liečbou bez odporúčania odborníka'],
      howToUse: 'Dodržujte odporúčané dávkovanie na obale produktu.',
      safeDisclaimer: 'Toto odporúčanie nenahrádza konzultáciu s lekárom ani odborníkom.',
    })
  }

  if (prompt.includes('"title"') && prompt.includes('"short_description"')) {
    return schema.parse({
      title: 'Optimalizovaný názov produktu — GrowMedica',
      short_description:
        'Prírodný výživový doplnok vhodný ako súčasť vyváženej stravy a aktívneho životného štýlu.',
    })
  }

  if (prompt.includes('"meta_title"') && prompt.includes('"meta_description"')) {
    return schema.parse({
      meta_title: 'Produkt GrowMedica | Doplnky výživy',
      meta_description:
        'Prírodný výživový doplnok GrowMedica pre každodennú podporu vitality. Objednajte online s doručením.',
    })
  }

  return schema.parse({
    summary: 'Na základe popisu odporúčame začať jemne a sledovať individuálnu toleranciu.',
    recommendedHandles: ['vitaminy-mineraly-mock-1', 'regeneracia-mock-1'],
    recommendedCategories: ['vitaminy-mineraly', 'regeneracia'],
    reasoningForUser:
      'Vybrané doplnky zodpovedajú všeobecnému cieľu podpory vitality. Odporúčanie nenahrádza konzultáciu s lekárom ani odborníkom.',
    warnings: [],
    bundleSuggestion: null,
  })
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
  throw new Error('Mistral API: Unexpected content type')
}

function isRetryableError(error: Error): boolean {
  if (error.name === 'AbortError') return true
  return /429|50[0-4]/.test(error.message)
}

function isAuthError(error: Error): boolean {
  return /401|403|unauthorized|forbidden|invalid api key/i.test(error.message)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function completeWithMistralKey<T>(
  apiKey: string,
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string,
  temperature: number,
): Promise<T> {
  const content = await withTimeout(
    mistralChatComplete({
      apiKey,
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      responseFormat: 'json_object',
    }),
    TIMEOUT_MS,
    'Mistral API timeout',
  )

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    console.error('[Mistral] Invalid JSON:', content.slice(0, 500))
    throw new Error('Mistral API: Invalid JSON response')
  }

  return schema.parse(parsed)
}

export async function callMistral<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  opts?: MistralOptions,
): Promise<T> {
  const ip = opts?.ip ?? 'unknown'

  if (opts?.userInput) {
    const complianceIssues = checkCompliance(opts.userInput)
    if (complianceIssues.length > 0) {
      console.warn('[Mistral] Input compliance issues:', complianceIssues)
      throw new AiError('Vstup obsahuje zakázané tvrdenia. Skúste to formulovať inak.', 422)
    }
  }

  const rateLimit = await checkRateLimit(ip)
  if (!rateLimit.allowed) {
    console.warn(`[Mistral] Rate limit exceeded for IP: ${ip}`)
    throw new AiError('Príliš veľa požiadaviek. Skúste to prosím neskôr.', 429)
  }

  if (process.env.MISTRAL_MOCK_MODE === '1') {
    return getMockMistralOutput(prompt, schema)
  }

  const { MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP, MISTRAL_MODEL } = getMistralEnv()
  const model = opts?.model ?? MISTRAL_MODEL
  const temperature = opts?.temperature ?? 0.7
  const apiKeys = [MISTRAL_API_KEY, MISTRAL_API_KEY_BACKUP].filter(
    (key, index, keys): key is string => Boolean(key) && keys.indexOf(key) === index,
  )

  let lastError: Error | undefined

  for (const apiKey of apiKeys) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await completeWithMistralKey(apiKey, prompt, schema, model, temperature)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (isAuthError(lastError) && apiKey !== apiKeys[apiKeys.length - 1]) {
          console.warn('[Mistral] Primary API key failed auth, trying backup key')
          break
        }

        if (!isRetryableError(lastError) || attempt === MAX_RETRIES - 1) {
          break
        }

        const delay = BASE_DELAY_MS * 2 ** attempt
        console.warn(
          `[Mistral] Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${lastError.message}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    if (lastError && !isAuthError(lastError)) {
      break
    }
  }

  console.error('[Mistral] Failed after retries:', lastError?.message)
  throw new AiError('Služba AI je dočasne nedostupná. Skúste to prosím neskôr.', 503)
}
