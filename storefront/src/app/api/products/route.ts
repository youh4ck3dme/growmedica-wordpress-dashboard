import { NextRequest, NextResponse } from 'next/server'
import { getProductByHandle, getProductsAccumulated } from '@/lib/catalog/products'
import type { Product, ProductListItem } from '@/lib/catalog/types'

const MAX_HANDLES = 50
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  const handlesParam = request.nextUrl.searchParams.get('handles')
  const limitParam = request.nextUrl.searchParams.get('limit')

  try {
    if (handlesParam) {
      const handles = handlesParam
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
        .slice(0, MAX_HANDLES)
      const products: ProductListItem[] = (
        await Promise.all(handles.map((handle) => getProductByHandle(handle)))
      ).filter((product): product is Product => product !== null)

      return NextResponse.json({ products })
    }

    const parsedLimit = Number(limitParam)
    const pageSize = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

    // Never dump the full catalog — capped single page.
    const data = await getProductsAccumulated({ first: pageSize, pages: 1 })
    const products = data.edges.map((e) => e.node)

    return NextResponse.json({ products, count: products.length, limit: pageSize })
  } catch (error) {
    console.error('[API Products] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch products', products: [] }, { status: 500 })
  }
}
