import { z } from 'zod'
import { getCmsProvider } from '@/lib/cms'
import {
  getProductByHandle,
  getProducts,
  getProductsAccumulated,
} from '@/lib/catalog/products'
import { getCollections } from '@/lib/catalog/collections'
import { callMistral } from '@/lib/ai/client'
import { AiError } from '@/lib/ai/errors'
import { isWooMockMode } from '@/lib/wordpress/mock'
import {
  buildMockOptimizedCopy,
  validateProductCopyOutput,
} from '@/lib/dashboard-agent/copyQuality'
import { buildOptimizeProductCopyPrompt } from '@/lib/dashboard-agent/prompts/optimize-product-copy'
import { storeExport } from './exports'
import type { AgentAction, AgentToolName } from './types'

const WP_ADMIN_HINT =
  'Shopify Admin bol odstránený. Správu produktov/skladu/objednávok rob v WordPress admin: https://cms.growmedica.cz/wp-admin'

const optimizeSchema = z.object({
  title: z.string(),
  short_description: z.string(),
})

const seoSchema = z.object({
  meta_title: z.string(),
  meta_description: z.string(),
})

export const AGENT_TOOL_DEFINITIONS = [
  { name: 'list_products', description: 'List catalog products with optional search and limit' },
  { name: 'get_product', description: 'Get a single product by slug/handle' },
  { name: 'list_collections', description: 'List catalog categories/collections' },
  { name: 'get_collection_products', description: 'List products in a category by handle' },
  { name: 'catalog_summary', description: 'Aggregated catalog stats (counts, price range)' },
  { name: 'optimize_product_copy', description: 'Suggest improved product title and short description' },
  { name: 'generate_product_seo', description: 'Generate meta title and description for SEO' },
  { name: 'bulk_update_prices', description: 'Bulk update prices (dry-run unless confirm=true)' },
  { name: 'export_catalog_csv', description: 'Export catalog to CSV download' },
  { name: 'get_integration_status', description: 'CMS and Mistral integration health' },
  { name: 'apply_product_copy', description: 'Apply optimized title and description to a product (confirm=true)' },
  { name: 'apply_product_seo', description: 'Apply SEO meta title and description to a product (confirm=true)' },
  { name: 'update_inventory', description: 'Update inventory quantity for a product (confirm=true)' },
  { name: 'list_orders', description: 'List recent orders (use WP admin — Shopify removed)' },
  { name: 'get_order', description: 'Get order detail (use WP admin — Shopify removed)' },
] as const

function isMockWriteMode(): boolean {
  return isWooMockMode() || process.env.MISTRAL_MOCK_MODE === '1'
}

function isStagingWriteAllowed(): boolean {
  if (isMockWriteMode()) return true
  return process.env.DASHBOARD_ALLOW_LIVE_WRITES === '1'
}

async function optimizeProductCopyLive(
  product: { title: string; description: string },
  ip: string,
): Promise<z.infer<typeof optimizeSchema>> {
  let lastIssues: string[] = []

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = buildOptimizeProductCopyPrompt(product, attempt > 0 ? lastIssues : undefined)
    const optimized = await callMistral(prompt, optimizeSchema, {
      ip,
      userInput: product.title,
      temperature: 0.35,
    })

    const validation = validateProductCopyOutput(optimized)
    if (validation.ok) return optimized

    lastIssues = validation.issues
  }

  throw new AiError(
    `Mistral copy nespĺňa požiadavky kvality: ${lastIssues.join('; ')}`,
    422,
  )
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

      case 'list_collections': {
        const limit = Number(args.limit ?? 50)
        const collections = await getCollections(Math.min(limit, 100))
        return {
          tool,
          args,
          result: {
            count: collections.length,
            collections: collections.map((c) => ({
              handle: c.handle,
              title: c.title,
              description: c.description?.slice(0, 120) ?? '',
            })),
          },
          status: 'ok',
        }
      }

      case 'get_collection_products': {
        const handle = String(args.handle ?? args.category ?? '')
        if (!handle) throw new Error('handle is required')
        const limit = Number(args.limit ?? 20)
        const result = await getProducts({ first: Math.min(limit, 50), category: handle, page: 1 })
        const products = result.edges.map((e) => ({
          handle: e.node.handle,
          title: e.node.title,
          price: e.node.priceRange.minVariantPrice.amount,
        }))
        return {
          tool,
          args,
          result: { category: handle, count: products.length, products },
          status: 'ok',
        }
      }

      case 'catalog_summary': {
        const catalog = await getProductsAccumulated({ pages: 3, first: 50 })
        const prices = catalog.edges
          .map((e) => parseFloat(e.node.priceRange.minVariantPrice.amount))
          .filter((p) => Number.isFinite(p))
        const available = catalog.edges.filter((e) => e.node.availableForSale).length
        const minPrice = prices.length ? Math.min(...prices) : 0
        const maxPrice = prices.length ? Math.max(...prices) : 0
        const collections = await getCollections(100)
        return {
          tool,
          args,
          result: {
            product_count: catalog.edges.length,
            collection_count: collections.length,
            available_count: available,
            price_min: minPrice.toFixed(2),
            price_max: maxPrice.toFixed(2),
            currency: catalog.edges[0]?.node.priceRange.minVariantPrice.currencyCode ?? 'EUR',
          },
          status: 'ok',
        }
      }

      case 'optimize_product_copy': {
        const handle = String(args.handle ?? '')
        if (!handle) throw new Error('handle is required')
        const product = await getProductByHandle(handle)
        if (!product) throw new Error(`Product not found: ${handle}`)

        const optimized =
          process.env.MISTRAL_MOCK_MODE === '1'
            ? buildMockOptimizedCopy(product)
            : await optimizeProductCopyLive(product, ip)

        const validation = validateProductCopyOutput(optimized)
        if (!validation.ok) {
          throw new AiError(
            `Copy nespĺňa požiadavky kvality: ${validation.issues.join('; ')}`,
            422,
          )
        }

        return { tool, args, result: { handle, ...optimized }, status: 'ok' }
      }

      case 'generate_product_seo': {
        const handle = String(args.handle ?? '')
        if (!handle) throw new Error('handle is required')
        const product = await getProductByHandle(handle)
        if (!product) throw new Error(`Product not found: ${handle}`)

        const prompt = `Vráť JSON: {"meta_title":"...","meta_description":"..."}
SEO meta pre doplnok výživy (max 60 znakov title, max 160 description, bez liečebných tvrdení).
Produkt: ${product.title}
Popis: ${product.description.slice(0, 400)}`

        const seo =
          process.env.MISTRAL_MOCK_MODE === '1'
            ? {
                meta_title: `${product.title} | GrowMedica`.slice(0, 60),
                meta_description: (product.description.replace(/<[^>]+>/g, '').slice(0, 160) || `${product.title} — výživový doplnok GrowMedica.`),
              }
            : await callMistral(prompt, seoSchema, {
                ip,
                userInput: product.title,
                temperature: 0.3,
              })

        return { tool, args, result: { handle, ...seo }, status: 'ok' }
      }

      case 'bulk_update_prices': {
        const percent = Number(args.percent_change ?? 0)
        const confirm = args.confirm === true
        const dryRun = !confirm || !isStagingWriteAllowed()

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
            result: {
              dry_run: true,
              updates,
              message: confirm
                ? 'Live zápis nie je povolený (nastavte DASHBOARD_ALLOW_LIVE_WRITES=1 na staging)'
                : 'Nastavte confirm=true pre zápis',
            },
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
        return {
          tool,
          args,
          result: {
            cms_provider: cms,
            mistral: mistralMock ? 'mock' : 'configured',
            catalog: wooMock ? 'mock' : 'live',
            shopify: 'removed',
            admin: 'wordpress',
            write_mode: isStagingWriteAllowed() ? 'live_writes_allowed' : 'dry_run_only',
          },
          status: 'ok',
        }
      }

      case 'apply_product_copy':
      case 'apply_product_seo':
      case 'update_inventory':
      case 'list_orders':
      case 'get_order': {
        return {
          tool,
          args,
          result: { removed: true, message: WP_ADMIN_HINT },
          status: 'error',
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

  if (/súhrn|summary|prehľad katalógu|prehlad katalogu/.test(lower)) {
    return [{ tool: 'catalog_summary', args: {} }]
  }

  if (/kategóri|kolekci|collections|categories/.test(lower) && !/produkt/.test(lower)) {
    return [{ tool: 'list_collections', args: { limit: 50 } }]
  }

  if (/bulk|hromadn|ceny|price/.test(lower)) {
    const match = command.match(/(-?\d+(?:\.\d+)?)\s*%/)
    const percent = match ? Number(match[1]) : 5
    const confirm = /potvrď|confirm|áno|ano|apply/.test(lower)
    return [{ tool: 'bulk_update_prices', args: { percent_change: percent, confirm } }]
  }

  const slugMatch = command.match(/(?:produkt[u]?|seo pre|seo)\s+([a-z0-9-]+)/i)
  const categoryMatch = command.match(/(?:kategóri[aie]|kolekci[aie])\s+([a-z0-9-]+)/i)
  const confirm = /potvrď|confirm|áno|ano|apply/.test(lower)

  if (slugMatch && /aplikuj seo|ulož seo|zapíš seo|apply.?seo/.test(lower)) {
    return [
      {
        tool: 'apply_product_seo',
        args: {
          handle: slugMatch[1],
          meta_title: 'Dry-run meta title',
          meta_description: 'Dry-run meta description for product SEO apply.',
          confirm,
        },
      },
    ]
  }

  if (slugMatch && /aplikuj copy|ulož copy|zapíš copy|apply.?copy/.test(lower)) {
    return [
      {
        tool: 'apply_product_copy',
        args: {
          handle: slugMatch[1],
          title: 'Dry-run title',
          short_description: 'Dry-run short description for product copy apply tool.',
          confirm,
        },
      },
    ]
  }

  if (slugMatch && /sklad|inventory|zásob|zasob/.test(lower)) {
    // Prefer qty after "sklad/inventory"; avoid grabbing digits from the product handle.
    const qtyMatch =
      command.match(/(?:sklad|inventory|zásob|zasob|quantity|qty)\s*[:=]?\s*(\d+)/i) ??
      command.match(/\b(\d+)\s*$/)
    return [
      {
        tool: 'update_inventory',
        args: {
          handle: slugMatch[1],
          quantity: qtyMatch ? Number(qtyMatch[1]) : 0,
          confirm,
        },
      },
    ]
  }

  if (slugMatch && /seo|meta/.test(lower)) {
    return [{ tool: 'generate_product_seo', args: { handle: slugMatch[1] } }]
  }

  if (slugMatch && /optimaliz|copy|text|popis/.test(lower)) {
    return [{ tool: 'optimize_product_copy', args: { handle: slugMatch[1] } }]
  }

  if (categoryMatch && /produkt/.test(lower)) {
    return [{ tool: 'get_collection_products', args: { handle: categoryMatch[1] } }]
  }

  if (slugMatch && /detail|info|zobraz/.test(lower)) {
    return [{ tool: 'get_product', args: { handle: slugMatch[1] } }]
  }
  if (/objednávk|objednávok|objednavk|orders?/i.test(lower)) {
    const limitMatch = command.match(/(\d+)/)
    return [{ tool: 'list_orders', args: { limit: limitMatch ? Number(limitMatch[1]) : 10 } }]
  }

  if (/produkt|katalóg|katalog|list|zoznam/.test(lower)) {
    return [{ tool: 'list_products', args: { limit: 10 } }]
  }

  return []
}
