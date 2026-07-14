import { z } from 'zod'

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

const wordpressEnvSchema = z.object({
  WORDPRESS_BASE_URL: z
    .string()
    .url('WORDPRESS_BASE_URL must be a valid URL')
    .refine((v) => v.startsWith('https://') || v.startsWith('http://'), {
      message: 'WORDPRESS_BASE_URL must use http or https',
    }),
  WOO_CONSUMER_KEY: z.string().min(1, 'WOO_CONSUMER_KEY is required'),
  WOO_CONSUMER_SECRET: z.string().min(1, 'WOO_CONSUMER_SECRET is required'),
  WORDPRESS_REVALIDATION_SECRET: z
    .string()
    .min(16, 'WORDPRESS_REVALIDATION_SECRET must be at least 16 characters')
    .optional(),
})

export type WordPressEnv = z.infer<typeof wordpressEnvSchema>

export function isWordPressConfigured(): boolean {
  return Boolean(
    readEnv('WORDPRESS_BASE_URL') &&
      readEnv('WOO_CONSUMER_KEY') &&
      readEnv('WOO_CONSUMER_SECRET'),
  )
}

export function validateWordPressEnv(): WordPressEnv {
  const result = wordpressEnvSchema.safeParse({
    WORDPRESS_BASE_URL: readEnv('WORDPRESS_BASE_URL'),
    WOO_CONSUMER_KEY: readEnv('WOO_CONSUMER_KEY'),
    WOO_CONSUMER_SECRET: readEnv('WOO_CONSUMER_SECRET'),
    WORDPRESS_REVALIDATION_SECRET: readEnv('WORDPRESS_REVALIDATION_SECRET'),
  })

  if (!result.success) {
    const message = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new Error(`Invalid WordPress environment variables: ${message}`)
  }

  return result.data
}

export function getWordPressRevalidationSecret(): string | undefined {
  return readEnv('WORDPRESS_REVALIDATION_SECRET')
}