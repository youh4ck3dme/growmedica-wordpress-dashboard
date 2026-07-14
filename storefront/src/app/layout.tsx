import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import Script from 'next/script'
// import { Montserrat, Inter, Playfair_Display } from 'next/font/google'
import '@/styles/globals.css'
import { DEFAULT_METADATA, getOrganizationJsonLd } from '@/lib/seo'
import { BRAND_COPY } from '@/lib/brand'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import HeaderShell from '@/components/layout/HeaderShell'
import TrustStrip from '@/components/layout/TrustStrip'
import Footer from '@/components/layout/Footer'
import { DeferredLayoutBanners } from '@/components/layout/DeferredLayoutBanners'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { StorefrontThemeProvider } from '@/components/theme/StorefrontThemeProvider'
import { NoorThemeChrome } from '@/components/theme/NoorThemeChrome'
import { NoorUiProviders } from '@/components/noor/providers/NoorUiProviders'
import { getThemeBootstrapScript, isStorefrontTheme, resolveInitialTheme, STORAGE_KEY } from '@/lib/theme/storefront-theme'
import { DASHBOARD_ROUTE_HEADER, isDashboardRouteHeader } from '@/lib/dashboard'

const montserrat = { variable: 'font-montserrat' }
const inter = { variable: 'font-inter' }
const playfair = { variable: 'font-playfair' }

export const metadata: Metadata = {
  ...DEFAULT_METADATA,
  applicationName: BRAND_COPY.siteName,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND_COPY.siteName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_COPY.themeColor,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const isDashboardRoute = isDashboardRouteHeader(headersList.get(DASHBOARD_ROUTE_HEADER))

  const cookieStore = await cookies()
  const cookieTheme = cookieStore.get(STORAGE_KEY)?.value
  const ssrTheme = resolveInitialTheme(
    isStorefrontTheme(cookieTheme) ? cookieTheme : null,
  )

  if (isDashboardRoute) {
    return (
      <html
        lang="sk"
        suppressHydrationWarning
        className={`${montserrat.variable} ${inter.variable} ${playfair.variable}`}
      >
        <body className="font-(--font-inter) antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html
      lang="sk"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-storefront-theme={ssrTheme}
      className={`${montserrat.variable} ${inter.variable} ${playfair.variable}`}
    >
      <body className="font-(--font-inter) antialiased" suppressHydrationWarning>
        <Script
          id="storefront-theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: getThemeBootstrapScript(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
        />
        <StorefrontThemeProvider>
          <NoorUiProviders>
            <MotionProvider>
              <NoorThemeChrome />
              <div className="flex min-h-dvh flex-col">
                <AnnouncementBar />
                <HeaderShell />
                <TrustStrip />
                <main className="flex-1">{children}</main>
                <Footer />
                <DeferredLayoutBanners />
              </div>
            </MotionProvider>
          </NoorUiProviders>
        </StorefrontThemeProvider>
      </body>
    </html>
  )
}
