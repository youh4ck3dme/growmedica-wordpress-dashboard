import { revalidateTag } from 'next/cache'

/** Bust storefront cache after dashboard product edits. */
export function revalidateProductCache(handle: string): string[] {
  const tags = ['products', `product-${handle}`]
  for (const tag of tags) {
    revalidateTag(tag)
  }
  return tags
}

export function revalidateCollectionsCache(): string[] {
  revalidateTag('collections')
  return ['collections']
}
