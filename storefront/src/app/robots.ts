import type { MetadataRoute } from 'next'
import { isSiteNoindexEnabled } from '@/lib/seo'
import { resolvePublicSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = resolvePublicSiteUrl()

  // Soft-launch: block entire site from crawlers (meta noindex is set separately).
  if (isSiteNoindexEnabled()) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/kosik',
          '/kosik/',
          '/checkout',
          '/checkout/',
          '/dashboard',
          '/dashboard/',
          '/prihlasenie',
          '/profil',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
