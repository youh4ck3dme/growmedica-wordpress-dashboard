'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface CollectionToolbarProps {
  vendors: string[]
  totalOnPage: number
}

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Odporúčané' },
  { value: 'price-asc', label: 'Cena: od najnižšej' },
  { value: 'price-desc', label: 'Cena: od najvyššej' },
  { value: 'title', label: 'Názov A–Z' },
] as const

export default function CollectionToolbar({ vendors, totalOnPage }: CollectionToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const sort = searchParams.get('sort') ?? 'recommended'
  const vendor = searchParams.get('vendor') ?? ''
  const inStock = searchParams.get('stock') === '1'

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      params.delete('page')
      startTransition(() => {
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
      })
    },
    [pathname, router, searchParams],
  )

  return (
    <div
      className={`collection-toolbar mb-6 flex flex-col gap-3 rounded-xl border border-(--color-border) bg-white p-4 sm:flex-row sm:items-center sm:justify-between ${isPending ? 'opacity-70' : ''}`}
      aria-label="Filtrovanie a triedenie produktov"
    >
      <p className="text-sm text-(--color-text-muted)">
        Zobrazených: <span className="font-semibold text-(--color-text)">{totalOnPage}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParams({ stock: e.target.checked ? '1' : null })}
            className="h-4 w-4 rounded border-(--color-border) accent-(--color-primary)"
          />
          Len skladom
        </label>

        {vendors.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-(--color-text-muted)">Značka</span>
            <select
              value={vendor}
              onChange={(e) => updateParams({ vendor: e.target.value || null })}
              className="rounded-lg border border-(--color-border) bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Všetky</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2 text-sm">
          <span className="text-(--color-text-muted)">Triediť</span>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === 'recommended' ? null : e.target.value })}
            className="rounded-lg border border-(--color-border) bg-white px-2 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
