import { NextRequest, NextResponse } from 'next/server'
import { getProductByHandle, getProductsAccumulated } from '@/lib/catalog/products'
import type { Product, ProductListItem } from '@/lib/shopify/types'

export async function GET(request: NextRequest) {
  const handlesParam = request.nextUrl.searchParams.get('handles')
  
  try {
    if (handlesParam) {
      const handles = handlesParam
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
      const products: ProductListItem[] = (
        await Promise.all(handles.map((handle) => getProductByHandle(handle)))
      ).filter((product): product is Product => product !== null)

      return NextResponse.json({ products })
    }

    const data = await getProductsAccumulated({ first: 250, pages: 'all' })
    const products = data.edges.map((e) => e.node)

    return NextResponse.json({ products })
  } catch (error) {
    console.error('[API Products] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch products', products: [] }, { status: 500 })
  }
}
