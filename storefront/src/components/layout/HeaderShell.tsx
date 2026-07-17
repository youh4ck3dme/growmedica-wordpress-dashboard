import GlassNavbar from '@/components/layout/GlassNavbar'
import { getMegaMenuCategories } from '@/lib/catalog/nav'

export default async function HeaderShell() {
  let megaMenuCategories: Awaited<ReturnType<typeof getMegaMenuCategories>> = []
  try {
    megaMenuCategories = await getMegaMenuCategories()
  } catch {
    // CMS not configured — header still renders without mega menu categories
  }

  return <GlassNavbar megaMenuCategories={megaMenuCategories} />
}
