'use client'

import type { AgentAction } from '@/lib/dashboard-agent/types'

type AgentActionResultsProps = {
  actions: AgentAction[]
  onSelectProduct?: (handle: string) => void
}

export default function AgentActionResults({ actions, onSelectProduct }: AgentActionResultsProps) {
  return (
    <div className="mt-3 space-y-3 border-t border-(--color-border)/50 pt-3">
      {actions.map((action, index) => (
        <div key={`${action.tool}-${index}`} className="text-xs">
          <ActionResult action={action} onSelectProduct={onSelectProduct} />
        </div>
      ))}
    </div>
  )
}

function ActionResult({
  action,
  onSelectProduct,
}: {
  action: AgentAction
  onSelectProduct?: (handle: string) => void
}) {
  if (action.status === 'error') {
    const error = (action.result as { error?: string }).error ?? 'chyba'
    return <p className="text-red-600">❌ {action.tool}: {error}</p>
  }

  if (action.tool === 'list_products') {
    const result = action.result as {
      products: Array<{ handle: string; title: string; price: string; available: boolean }>
    }
    return (
      <div className="overflow-x-auto rounded border border-(--color-border)/50">
        <table className="w-full text-left">
          <thead>
            <tr className="text-(--color-text-muted)">
              <th className="px-2 py-1">Produkt</th>
              <th className="px-2 py-1">Cena</th>
              <th className="px-2 py-1">Sklad</th>
            </tr>
          </thead>
          <tbody>
            {result.products?.map((product) => (
              <tr key={product.handle} className="border-t border-(--color-border)/30">
                <td className="px-2 py-1">
                  {onSelectProduct ? (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.handle)}
                      className="text-(--color-primary) hover:underline"
                    >
                      {product.title}
                    </button>
                  ) : (
                    product.title
                  )}
                </td>
                <td className="px-2 py-1">{product.price} EUR</td>
                <td className="px-2 py-1">{product.available ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (action.tool === 'catalog_summary') {
    const result = action.result as {
      product_count: number
      collection_count: number
      available_count: number
      price_min: string
      price_max: string
      currency: string
    }
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Produkty" value={String(result.product_count)} />
        <Stat label="Kategórie" value={String(result.collection_count)} />
        <Stat label="Dostupné" value={String(result.available_count)} />
        <Stat label="Ceny" value={`${result.price_min}–${result.price_max} ${result.currency}`} />
      </div>
    )
  }

  if (action.tool === 'export_catalog_csv') {
    const result = action.result as { download_path: string }
    return (
      <a
        href={result.download_path}
        className="inline-flex rounded bg-(--color-primary) px-3 py-1.5 text-white hover:opacity-90"
        download
      >
        Stiahnuť CSV export
      </a>
    )
  }

  if (action.tool === 'optimize_product_copy') {
    const result = action.result as {
      handle: string
      title: string
      short_description: string
    }
    return (
      <div className="space-y-1 rounded border border-(--color-border)/50 p-2">
        <p>
          <strong>Názov:</strong> {result.title}
        </p>
        <p>
          <strong>Popis:</strong> {result.short_description}
        </p>
        {onSelectProduct && (
          <button
            type="button"
            onClick={() => onSelectProduct(result.handle)}
            className="text-(--color-primary) hover:underline"
          >
            Otvoriť produkt →
          </button>
        )}
      </div>
    )
  }

  if (action.tool === 'bulk_update_prices') {
    const result = action.result as {
      dry_run?: boolean
      updates?: Array<{ handle: string; from: string; to: string }>
    }
    if (!result.updates?.length) return <p>Žiadne zmeny cien.</p>
    return (
      <div className="overflow-x-auto rounded border border-(--color-border)/50">
        <table className="w-full text-left">
          <thead>
            <tr className="text-(--color-text-muted)">
              <th className="px-2 py-1">Handle</th>
              <th className="px-2 py-1">Z</th>
              <th className="px-2 py-1">Na</th>
            </tr>
          </thead>
          <tbody>
            {result.updates.map((row) => (
              <tr key={row.handle} className="border-t border-(--color-border)/30">
                <td className="px-2 py-1">{row.handle}</td>
                <td className="px-2 py-1">{row.from}</td>
                <td className="px-2 py-1">{row.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.dry_run && (
          <p className="mt-1 text-amber-700">⚠️ Dry-run — potvrďte príkaz s „confirm“ pre zápis.</p>
        )}
      </div>
    )
  }

  if (action.tool === 'list_orders') {
    const result = action.result as {
      orders: Array<{ name: string; total: string; currency: string; financialStatus: string }>
    }
    if (!result.orders?.length) return <p>Žiadne objednávky (možno chýba read_orders scope).</p>
    return (
      <div className="overflow-x-auto rounded border border-(--color-border)/50">
        <table className="w-full text-left">
          <thead>
            <tr className="text-(--color-text-muted)">
              <th className="px-2 py-1">Číslo</th>
              <th className="px-2 py-1">Suma</th>
              <th className="px-2 py-1">Stav</th>
            </tr>
          </thead>
          <tbody>
            {result.orders.map((order) => (
              <tr key={order.name} className="border-t border-(--color-border)/30">
                <td className="px-2 py-1">{order.name}</td>
                <td className="px-2 py-1">
                  {order.total} {order.currency}
                </td>
                <td className="px-2 py-1">{order.financialStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <details className="opacity-80">
      <summary className="cursor-pointer">{action.tool}</summary>
      <pre className="mt-1 overflow-x-auto rounded bg-black/5 p-2 text-[11px]">
        {JSON.stringify(action.result, null, 2)}
      </pre>
    </details>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-(--color-border)/50 px-2 py-1.5">
      <p className="text-(--color-text-muted)">{label}</p>
      <p className="font-semibold text-(--color-text)">{value}</p>
    </div>
  )
}
