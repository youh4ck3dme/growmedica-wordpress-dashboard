import type { MetadataRoute } from 'next'
import { resolvePublicSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = resolvePublicSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/kosik', '/checkout', '/dashboard'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
