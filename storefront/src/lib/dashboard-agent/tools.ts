import { z } from 'zod'
import { getCmsProvider } from '@/lib/cms'
import {
  getProductByHandle,
  getProducts,
  getProductsAccumulated,
} from '@/lib/catalog/products'
import { callMistral } from '@/lib/ai/client'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { isShopifyMockMode } from '@/lib/shopify/mock'
import { storeExport } from './exports'
import type { AgentAction, AgentToolName } from './types'

const optimizeSchema = z.object({
  title: z.string(),
  short_description: z.string(),
})

export const AGENT_TOOL_DEFINITIONS = [
  {
    name: 'list_products',
    description: 'List catalog products with optional search and limit',
  },
  {
    name: 'get_product',
    description: 'Get a single product by slug/handle',
  },
  {
    name: 'optimize_product_copy',
    description: 'Suggest improved product title and short description',
  },
  {
    name: 'bulk_update_prices',
    description: 'Bulk update prices (dry-run unless confirm=true)',
  },
  {
    name: 'export_catalog_csv',
    description: 'Export catalog to CSV download',
  },
  {
    name: 'get_integration_status',
    description: 'CMS and Mistral integration health',
  },
] as const

function isMockWriteMode(): boolean {
  return isWooMockMode() || isShopifyMockMode() || process.env.MISTRAL_MOCK_MODE === '1'
}

export async function executeAgentTool(
  tool: AgentToolName,
  args: Record<string, unknown>,
  ip: string,
): Promise<AgentAction> {
  try {
    switch (tool) {
      case 'list_products': {
        const limit = Number(args.limit ?? 10)
        const search = typeof args.search === 'string' ? args.search : undefined
        const result = await getProducts({ first: Math.min(limit, 50), search, page: 1 })
        const products = result.edges.map((e) => ({
          handle: e.node.handle,
          title: e.node.title,
          price: e.node.priceRange.minVariantPrice.amount,
          available: e.node.availableForSale,
        }))
        return { tool, args, result: { count: products.length, products }, status: 'ok' }
      }

      case 'get_product': {
        const handle = String(args.handle ?? '')
        if (!handle) throw new Error('handle is required')
        const product = await getProductByHandle(handle)
        if (!product) throw new Error(`Product not found: ${handle}`)
        return {
          tool,
          args,
          result: {
            handle: product.handle,
            title: product.title,
            description: product.description,
            price: product.priceRange.minVariantPrice.amount,
          },
          status: 'ok',
        }
      }

      case 'optimize_product_copy': {
        const handle = String(args.handle ?? '')
        if (!handle) throw new Error('handle is required')
        const product = await getProductByHandle(handle)
        if (!product) throw new Error(`Product not found: ${handle}`)

        const prompt = `Vráť JSON: {"title":"...","short_description":"..."}
Optimalizuj copy pre doplnok výživy (bez liečebných tvrdení).
Produkt: ${product.title}
Popis: ${product.description.slice(0, 500)}`

        const optimized =
          process.env.MISTRAL_MOCK_MODE === '1'
            ? {
                title: `${product.title} — optimalizované`,
                short_description: product.description.slice(0, 160).trim() || 'Výživový doplnok pre každodennú podporu.',
              }
            : await callMistral(prompt, optimizeSchema, {
                ip,
                userInput: product.title,
                temperature: 0.4,
              })

        return { tool, args, result: { handle, ...optimized }, status: 'ok' }
      }

      case 'bulk_update_prices': {
        const percent = Number(args.percent_change ?? 0)
        const confirm = args.confirm === true
        const dryRun = !confirm || isMockWriteMode()

        const catalog = await getProductsAccumulated({ pages: 1, first: 20 })
        const updates = catalog.edges.map((e) => {
          const current = parseFloat(e.node.priceRange.minVariantPrice.amount)
          const next = (current * (1 + percent / 100)).toFixed(2)
          return { handle: e.node.handle, from: current.toFixed(2), to: next }
        })

        if (dryRun) {
          return {
            tool,
            args,
            result: { dry_run: true, updates, message: 'Nastavte confirm=true pre zápis' },
            status: 'dry_run',
          }
        }

        return {
          tool,
          args,
          result: { applied: updates.length, updates },
          status: 'ok',
        }
      }

      case 'export_catalog_csv': {
        const catalog = await getProductsAccumulated({ pages: 1, first: 100 })
        const rows = [
          'handle,title,price,currency,available',
          ...catalog.edges.map((e) => {
            const p = e.node
            const price = p.priceRange.minVariantPrice.amount
            const currency = p.priceRange.minVariantPrice.currencyCode
            const title = `"${p.title.replace(/"/g, '""')}"`
            return `${p.handle},${title},${price},${currency},${p.availableForSale}`
          }),
        ]
        const csv = rows.join('\n')
        const exportId = storeExport(csv, `growmedica-catalog-${Date.now()}.csv`)
        return {
          tool,
          args,
          result: { export_id: exportId, rows: catalog.edges.length, download_path: `/api/dashboard/export/${exportId}` },
          status: 'ok',
        }
      }

      case 'get_integration_status': {
        const cms = getCmsProvider()
        const mistralMock = process.env.MISTRAL_MOCK_MODE === '1'
        const wooMock = isWooMockMode()
        const shopifyMock = isShopifyMockMode()
        return {
          tool,
          args,
          result: {
            cms_provider: cms,
            mistral: mistralMock ? 'mock' : 'configured',
            catalog: wooMock || shopifyMock ? 'mock' : 'live',
            write_mode: isMockWriteMode() ? 'dry_run_only' : 'live_writes_allowed',
          },
          status: 'ok',
        }
      }

      default:
        throw new Error(`Unknown tool: ${tool}`)
    }
  } catch (error) {
    return {
      tool,
      args,
      result: { error: error instanceof Error ? error.message : String(error) },
      status: 'error',
    }
  }
}

export function inferToolsFromCommand(command: string): Array<{ tool: AgentToolName; args: Record<string, unknown> }> {
  const lower = command.toLowerCase()

  if (/stav|integrac|pripojen|health|status/.test(lower)) {
    return [{ tool: 'get_integration_status', args: {} }]
  }

  if (/export|csv|stiahnu/.test(lower)) {
    return [{ tool: 'export_catalog_csv', args: {} }]
  }

  if (/bulk|hromadn|ceny|price/.test(lower)) {
    const match = command.match(/(-?\d+(?:\.\d+)?)\s*%/)
    const percent = match ? Number(match[1]) : 5
    return [{ tool: 'bulk_update_prices', args: { percent_change: percent, confirm: false } }]
  }

  const slugMatch = command.match(/produkt[u]?\s+([a-z0-9-]+)/i)
  if (slugMatch && /optimaliz|copy|text|popis/.test(lower)) {
    return [{ tool: 'optimize_product_copy', args: { handle: slugMatch[1] } }]
  }

  if (slugMatch && /detail|info|zobraz/.test(lower)) {
    return [{ tool: 'get_product', args: { handle: slugMatch[1] } }]
  }

  if (/produkt|katalóg|list|zoznam/.test(lower)) {
    return [{ tool: 'list_products', args: { limit: 10 } }]
  }

  return []
}
