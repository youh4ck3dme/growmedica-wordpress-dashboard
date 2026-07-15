'use client'

import dynamic from 'next/dynamic'

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
      <PwaInstallBanner />
      <PharmacistAssistantDrawer />
      <FloatingAssistantFab />
    </>
  )
}
