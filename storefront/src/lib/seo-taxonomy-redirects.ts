import taxonomy from '../../../reports/seo-taxonomy/growmedica-seo-menu-tree.json'

type FrozenRedirect = {
  sourceUrl: string
  targetUrl: string
  statusCode: number
  objectType?: string
}

type WooImportRow = {
  handle: string
  importStatus: string
}

export type SeoTaxonomyRedirect = {
  source: string
  destination: string
  permanent: true
}

function currentStorefrontPath(urlValue: string): string {
  const pathname = new URL(urlValue).pathname
  // Host-independent: drop locale prefix; storefront uses cookie/?lang= + unprefixed routes.
  return pathname.replace(/^\/(sk|cs|en|de)(?=\/|$)/, '') || '/'
}

function holdHandles(): Set<string> {
  const rows = (taxonomy.wooImportProducts ?? []) as WooImportRow[]
  return new Set(rows.filter((row) => row.importStatus === 'HOLD').map((row) => row.handle))
}

/** Next.js redirects() entries from frozen SEO taxonomy (path-only, no host). */
export function getSeoTaxonomyRedirects(): SeoTaxonomyRedirect[] {
  const redirects = taxonomy.redirects as FrozenRedirect[]
  const hold = holdHandles()
  const seen = new Set<string>()
  const out: SeoTaxonomyRedirect[] = []

  for (const redirect of redirects) {
    if (redirect.statusCode !== 301) {
      throw new Error(`Frozen taxonomy contains non-permanent redirect: ${redirect.sourceUrl}`)
    }

    const source = new URL(redirect.sourceUrl).pathname
    const destination = currentStorefrontPath(redirect.targetUrl)

    // Never publish a PDP redirect for HOLD allowlist rows.
    const productHandle = destination.match(/^\/produkty\/([^/]+)\/?$/)?.[1]
    if (productHandle && hold.has(productHandle)) {
      continue
    }

    if (seen.has(source)) throw new Error(`Duplicate frozen redirect source: ${source}`)
    if (source === destination) throw new Error(`Frozen redirect loop: ${source}`)
    seen.add(source)

    out.push({ source, destination, permanent: true })
  }

  return out
}
