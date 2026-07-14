import { z } from 'zod'
import { getCmsProvider } from '@/lib/cms'

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function readShopifyStoreDomain(): string | undefined {
  return readEnv('SHOPIFY_STORE_DOMAIN') ?? readEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
}

function readShopifyStorefrontToken(): string | undefined {
  return (
    readEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN') ??
    readEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN')
  )
}

const shopifyEnvSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z
    .string()
    .min(1, 'SHOPIFY_STORE_DOMAIN is required')
    .refine((v) => v.endsWith('.myshopify.com'), {
      message: 'SHOPIFY_STORE_DOMAIN must end with .myshopify.com',
    }),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z
    .string()
    .min(1, 'SHOPIFY_STOREFRONT_ACCESS_TOKEN is required'),
  SHOPIFY_API_VERSION: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'SHOPIFY_API_VERSION must match YYYY-MM'),
})

const revalidationSecretSchema = z
  .string()
  .min(16, 'SHOPIFY_REVALIDATION_SECRET must be at least 16 characters')
  .refine((v) => !v.startsWith('shpat_'), {
    message:
      'SHOPIFY_REVALIDATION_SECRET must be a custom webhook secret, not a Shopify Admin API token',
  })

export type ShopifyEnv = z.infer<typeof shopifyEnvSchema>

let cachedShopifyEnv: ShopifyEnv | null = null

function validateShopifyEnv(): ShopifyEnv {
  const result = shopifyEnvSchema.safeParse({
    SHOPIFY_STORE_DOMAIN: readShopifyStoreDomain(),
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: readShopifyStorefrontToken(),
    SHOPIFY_API_VERSION: readEnv('SHOPIFY_API_VERSION') ?? '2025-01',
  })

  if (!result.success) {
    console.error('Invalid Shopify environment variables:')
    result.error.errors.forEach((err) => {
      console.error(`  → ${err.path.join('.')}: ${err.message}`)
    })
    throw new Error(
      'Invalid Shopify environment variables. Copy .env.example to .env.local and fill in values.',
    )
  }

  return result.data
}

/** Validated Shopify config — only required when CMS_PROVIDER=shopify. */
export function getShopifyEnv(): ShopifyEnv {
  if (cachedShopifyEnv) return cachedShopifyEnv
  cachedShopifyEnv = validateShopifyEnv()
  return cachedShopifyEnv
}

/** Lazy proxy so shopify/client.ts keeps `env.*` access without import-time validation. */
export const env: ShopifyEnv = new Proxy({} as ShopifyEnv, {
  get(_target, prop: keyof ShopifyEnv) {
    return getShopifyEnv()[prop]
  },
})

/** Webhook revalidation secret — Shopify or WordPress depending on CMS provider. */
export function getRevalidationSecret(): string {
  const provider = getCmsProvider()
  if (provider === 'wordpress') {
    const wpSecret = readEnv('WORDPRESS_REVALIDATION_SECRET')
    const result = revalidationSecretSchema.safeParse(wpSecret)
    if (!result.success) {
      const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      throw new Error(`Invalid WORDPRESS_REVALIDATION_SECRET: ${message}`)
    }
    return result.data
  }

  const result = revalidationSecretSchema.safeParse(process.env.SHOPIFY_REVALIDATION_SECRET)
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(`Invalid SHOPIFY_REVALIDATION_SECRET: ${message}`)
  }
  return result.data
}
