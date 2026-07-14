'use client'

import dynamic from 'next/dynamic'

const CookieBanner = dynamic(() => import('@/components/ui/CookieBanner'), {
  ssr: false,
})

const PwaInstallBanner = dynamic(() => import('@/components/layout/PwaInstallBanner'), {
  ssr: false,
})

const PharmacistAssistantDrawer = dynamic(
  () =>
    import('@/components/ai/PharmacistAssistantDrawer').then((mod) => ({
      default: mod.PharmacistAssistantDrawer,
    })),
  { ssr: false },
)

const FloatingAssistantFab = dynamic(
  () =>
    import('@/components/ai/FloatingAssistantFab').then((mod) => ({
      default: mod.FloatingAssistantFab,
    })),
  { ssr: false },
)

export function DeferredLayoutBanners() {
  return (
    <>
      <CookieBanner />
      <PwaInstallBanner />
      <PharmacistAssistantDrawer />
      <FloatingAssistantFab />
    </>
  )
}
