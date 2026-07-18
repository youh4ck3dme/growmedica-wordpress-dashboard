import { z } from 'zod'

const wordpressEnvSchema = z.object({
  WORDPRESS_BASE_URL: z
    .string()
    .url('WORDPRESS_BASE_URL must be a valid URL')
    .refine((v) => v.startsWith('https://') || v.startsWith('http://'), {
      message: 'WORDPRESS_BASE_URL must use http or https',
    }),
  WOO_CONSUMER_KEY: z.string().min(1, 'WOO_CONSUMER_KEY is required'),
  WOO_CONSUMER_SECRET: z.string().min(1, 'WOO_CONSUMER_SECRET is required'),
})

export type WordPressEnv = z.infer<typeof wordpressEnvSchema>

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

const revalidationSecretSchema = z
  .string()
  .min(16, 'WORDPRESS_REVALIDATION_SECRET must be at least 16 characters')
  .refine((v) => !v.startsWith('shpat_'), {
    message: 'WORDPRESS_REVALIDATION_SECRET must not look like a Shopify Admin token',
  })

let cachedWordPressEnv: WordPressEnv | null = null

function validateWordPressEnv(): WordPressEnv {
  const result = wordpressEnvSchema.safeParse({
    WORDPRESS_BASE_URL: readEnv('WORDPRESS_BASE_URL'),
    WOO_CONSUMER_KEY: readEnv('WOO_CONSUMER_KEY'),
    WOO_CONSUMER_SECRET: readEnv('WOO_CONSUMER_SECRET'),
  })

  if (!result.success) {
    console.error('Invalid WordPress environment variables:')
    result.error.errors.forEach((err) => {
      console.error(`  → ${err.path.join('.')}: ${err.message}`)
    })
    throw new Error(
      'Invalid WordPress environment variables. Copy .env.example to .env.local and fill in values.',
    )
  }

  return result.data
}

/** Validated WordPress/Woo config (WOO_MOCK_MODE=1 skips real credentials). */
export function getWordPressEnv(): WordPressEnv {
  if (process.env.WOO_MOCK_MODE === '1') {
    return {
      WORDPRESS_BASE_URL: readEnv('WORDPRESS_BASE_URL') ?? 'http://localhost:8080',
      WOO_CONSUMER_KEY: readEnv('WOO_CONSUMER_KEY') ?? 'ck_mock',
      WOO_CONSUMER_SECRET: readEnv('WOO_CONSUMER_SECRET') ?? 'cs_mock',
    }
  }
  if (cachedWordPressEnv) return cachedWordPressEnv
  cachedWordPressEnv = validateWordPressEnv()
  return cachedWordPressEnv
}

/** Webhook / ISR revalidation secret (WordPress only). */
export function getRevalidationSecret(): string {
  const wpSecret = readEnv('WORDPRESS_REVALIDATION_SECRET')
  const result = revalidationSecretSchema.safeParse(wpSecret)
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(`Invalid WORDPRESS_REVALIDATION_SECRET: ${message}`)
  }
  return result.data
}
