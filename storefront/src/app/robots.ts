import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://growmedica.nexify-studio.tech'

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
