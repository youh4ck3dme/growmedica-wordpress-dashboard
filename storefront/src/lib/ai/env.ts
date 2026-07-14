import { z } from 'zod'

const mistralEnvSchema = z.object({
  MISTRAL_API_KEY: z.string().min(1, 'MISTRAL_API_KEY is required'),
  MISTRAL_API_KEY_BACKUP: z.string().min(1).optional(),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

type MistralEnv = z.infer<typeof mistralEnvSchema>

let cachedEnv: MistralEnv | null = null

export function getMistralEnv(): MistralEnv {
  if (cachedEnv) return cachedEnv

  const result = mistralEnvSchema.safeParse({
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY?.trim(),
    MISTRAL_API_KEY_BACKUP: process.env.MISTRAL_API_KEY_BACKUP?.trim(),
    MISTRAL_MODEL: process.env.MISTRAL_MODEL?.trim() || 'mistral-large-latest',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  })

  if (!result.success) {
    throw new Error(
      'Chýbajúce alebo neplatné premenné prostredia pre Mistral AI. ' +
        'Skopírujte .env.example do .env.local a doplňte MISTRAL_API_KEY.',
    )
  }

  cachedEnv = result.data
  return cachedEnv
}
