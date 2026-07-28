import GlassNavbar from '@/components/layout/GlassNavbar'
import { getMegaMenuCategories } from '@/lib/catalog/nav'
import { getRequestLocale } from '@/lib/i18n/server'

export default async function HeaderShell() {
  const locale = await getRequestLocale()
  let megaMenuCategories: Awaited<ReturnType<typeof getMegaMenuCategories>> = []
  try {
    megaMenuCategories = await getMegaMenuCategories(3, locale)
  } catch {
    // CMS not configured — header still renders without mega menu categories
  }

  return <GlassNavbar megaMenuCategories={megaMenuCategories} />
}
