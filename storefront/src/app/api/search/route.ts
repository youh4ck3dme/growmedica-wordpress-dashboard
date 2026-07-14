import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/catalog/products'
import { formatMoney } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const data = await getProducts({ first: 8, query: q, sortKey: 'RELEVANCE' })
    const products = data.edges.map(({ node }) => ({
      handle: node.handle,
      title: node.title,
      vendor: node.vendor,
      availableForSale: node.availableForSale,
      priceLabel: formatMoney(node.priceRange.minVariantPrice),
    }))

    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] })
  }
}
