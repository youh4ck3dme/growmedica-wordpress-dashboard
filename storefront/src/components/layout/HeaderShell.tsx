import GlassNavbar from '@/components/layout/GlassNavbar'
import type { MegaMenuCategory } from '@/components/layout/HeaderMegaMenu'
import {
  getCategoryFeaturedProducts,
  getNavCollectionItems,
} from '@/lib/catalog/nav'

export default async function HeaderShell() {
  let megaMenuCategories: MegaMenuCategory[] = []
  try {
    const collections = await getNavCollectionItems()
    const withProducts = collections.filter((c) => c.productCount > 0)

    megaMenuCategories = await Promise.all(
      withProducts.map(async (cat) => ({
        ...cat,
        featuredProducts: await getCategoryFeaturedProducts(cat.handle, 3),
      }))
    )
  } catch {
    // Shopify not configured — header still renders without mega menu categories
  }

  return <GlassNavbar megaMenuCategories={megaMenuCategories} />
}
