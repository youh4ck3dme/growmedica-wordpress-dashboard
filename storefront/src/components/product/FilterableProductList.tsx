'use client'

import { useState, useMemo, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Filter, X, Search, ChevronDown, Check, SlidersHorizontal } from 'lucide-react'
import type { ProductListItem } from '@/lib/shopify/types'
import { ProductCard } from './ProductCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface FilterableProductListProps {
  initialProducts: ProductListItem[]
  initialQuery?: string
}

const SORT_OPTIONS = [
  { key: 'BEST_SELLING', label: 'Najpredávanejšie' },
  { key: 'PRICE_ASC', label: 'Cena: od najnižšej' },
  { key: 'PRICE_DESC', label: 'Cena: od najvyššej' },
  { key: 'TITLE', label: 'Abecedne A–Z' },
]

export function FilterableProductList({ initialProducts, initialQuery = '' }: FilterableProductListProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('BEST_SELLING')
  
  // Calculate price boundaries from initial products
  const priceLimits = useMemo(() => {
    if (initialProducts.length === 0) return { min: 0, max: 100 }
    let min = Infinity
    let max = -Infinity
    for (const p of initialProducts) {
      const price = parseFloat(p.priceRange.minVariantPrice.amount)
      if (price < min) min = price
      if (price > max) max = price
    }
    return {
      min: Math.floor(min),
      max: Math.ceil(max),
    }
  }, [initialProducts])

  const [priceRange, setPriceRange] = useState<[number, number]>([priceLimits.min, priceLimits.max])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Reset price range slider if limits change (e.g. initial products load)
  useEffect(() => {
    setPriceRange([priceLimits.min, priceLimits.max])
  }, [priceLimits])

  // Extract unique facets from loaded products
  const facets = useMemo(() => {
    const vendors = new Set<string>()
    const types = new Set<string>()
    const tags = new Set<string>()

    for (const p of initialProducts) {
      if (p.vendor) vendors.add(p.vendor)
      if (p.productType) types.add(p.productType)
      if (p.tags) {
        for (const t of p.tags) {
          // Skip internal tags like Shopify bundles
          if (t !== 'health-bundle' && !t.startsWith('bundle-category:')) {
            tags.add(t)
          }
        }
      }
    }

    return {
      vendors: Array.from(vendors).sort(),
      types: Array.from(types).sort(),
      tags: Array.from(tags).sort(),
    }
  }, [initialProducts])

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    // 1. Text Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.vendor && p.vendor.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // 2. Price Range Filter
    result = result.filter((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // 3. Vendor Filter
    if (selectedVendors.size > 0) {
      result = result.filter((p) => selectedVendors.has(p.vendor))
    }

    // 4. Product Type Filter
    if (selectedTypes.size > 0) {
      result = result.filter((p) => selectedTypes.has(p.productType))
    }

    // 5. Tags Filter
    if (selectedTags.size > 0) {
      result = result.filter((p) => p.tags.some((tag) => selectedTags.has(tag)))
    }

    // Sort result
    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount))
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount))
    } else if (sortBy === 'TITLE') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'sk'))
    }

    return result
  }, [initialProducts, searchQuery, priceRange, selectedVendors, selectedTypes, selectedTags, sortBy])

  // Toggle handlers
  const toggleVendor = (vendor: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev)
      if (next.has(vendor)) next.delete(vendor)
      else next.add(vendor)
      return next
    })
  }

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const clearAllFilters = () => {
    setSelectedVendors(new Set())
    setSelectedTypes(new Set())
    setSelectedTags(new Set())
    setPriceRange([priceLimits.min, priceLimits.max])
    setSearchQuery('')
  }

  const isFilterActive =
    selectedVendors.size > 0 ||
    selectedTypes.size > 0 ||
    selectedTags.size > 0 ||
    priceRange[0] !== priceLimits.min ||
    priceRange[1] !== priceLimits.max ||
    searchQuery !== ''

  // Count matches helper
  const getVendorCount = (vendor: string) => {
    return initialProducts.filter((p) => p.vendor === vendor).length
  }

  const getTypeCount = (type: string) => {
    return initialProducts.filter((p) => p.productType === type).length
  }

  const getTagCount = (tag: string) => {
    return initialProducts.filter((p) => p.tags.includes(tag)).length
  }

  // Filter form JSX
  const filterControlsJsx = (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <h4 className="text-xs font-semibold text-(--color-text) uppercase tracking-wider mb-2">Hľadať v produktoch</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Hľadať..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-(--color-text-light)" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-(--color-text-light) hover:text-(--color-text)"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Price Slider */}
      {priceLimits.max > priceLimits.min && (
        <div className="border-t border-(--color-border) pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold text-(--color-text) uppercase tracking-wider">Cena</h4>
            { (priceRange[0] !== priceLimits.min || priceRange[1] !== priceLimits.max) && (
              <button
                onClick={() => setPriceRange([priceLimits.min, priceLimits.max])}
                className="text-xs text-(--color-primary) font-semibold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-(--color-text-light) block uppercase font-bold">Min</label>
                <input
                  type="number"
                  min={priceLimits.min}
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Math.max(priceLimits.min, Math.min(priceRange[1], Number(e.target.value)))
                    setPriceRange([val, priceRange[1]])
                  }}
                  className="w-full text-xs p-1.5 rounded border border-(--color-border) outline-none"
                />
              </div>
              <span className="text-(--color-text-muted) pt-4">—</span>
              <div className="flex-1">
                <label className="text-[10px] text-(--color-text-light) block uppercase font-bold">Max</label>
                <input
                  type="number"
                  min={priceRange[0]}
                  max={priceLimits.max}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Math.min(priceLimits.max, Math.max(priceRange[0], Number(e.target.value)))
                    setPriceRange([priceRange[0], val])
                  }}
                  className="w-full text-xs p-1.5 rounded border border-(--color-border) outline-none"
                />
              </div>
            </div>
            
            <input
              type="range"
              min={priceLimits.min}
              max={priceLimits.max}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full accent-(--color-primary)"
            />
          </div>
        </div>
      )}

      {/* Vendors (Výrobca) */}
      {facets.vendors.length > 0 && (
        <div className="border-t border-(--color-border) pt-4">
          <h4 className="text-xs font-semibold text-(--color-text) uppercase tracking-wider mb-3">Výrobca</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {facets.vendors.map((vendor) => {
              const active = selectedVendors.has(vendor)
              const count = getVendorCount(vendor)
              return (
                <label
                  key={vendor}
                  className="flex items-center justify-between text-sm cursor-pointer group py-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => toggleVendor(vendor)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-all",
                        active 
                          ? "border-(--color-primary) bg-(--color-primary) text-white" 
                          : "border-gray-300 bg-white group-hover:border-(--color-primary)"
                      )}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className={cn("text-gray-700 transition-colors", active && "text-(--color-primary) font-semibold")}>
                      {vendor}
                    </span>
                  </div>
                  <span className="text-xs text-(--color-text-light) bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Types (Forma) */}
      {facets.types.length > 0 && (
        <div className="border-t border-(--color-border) pt-4">
          <h4 className="text-xs font-semibold text-(--color-text) uppercase tracking-wider mb-3">Forma / Kategória</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {facets.types.map((type) => {
              const active = selectedTypes.has(type)
              const count = getTypeCount(type)
              return (
                <label
                  key={type}
                  className="flex items-center justify-between text-sm cursor-pointer group py-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => toggleType(type)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-all",
                        active 
                          ? "border-(--color-primary) bg-(--color-primary) text-white" 
                          : "border-gray-300 bg-white group-hover:border-(--color-primary)"
                      )}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className={cn("text-gray-700 transition-colors", active && "text-(--color-primary) font-semibold")}>
                      {type}
                    </span>
                  </div>
                  <span className="text-xs text-(--color-text-light) bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags (Ciel / Účinok) */}
      {facets.tags.length > 0 && (
        <div className="border-t border-(--color-border) pt-4">
          <h4 className="text-xs font-semibold text-(--color-text) uppercase tracking-wider mb-3">Účinok a účel</h4>
          <div className="flex flex-wrap gap-1.5">
            {facets.tags.map((tag) => {
              const active = selectedTags.has(tag)
              const count = getTagCount(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5",
                    active
                      ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary) font-semibold"
                      : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-primary) bg-white"
                  )}
                >
                  <span>{tag}</span>
                  <span className={cn("text-[9px] px-1 rounded-full bg-gray-100", active && "bg-white text-(--color-primary)")}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Desktop Sidebar (Sidebar Column) */}
      <aside className="hidden lg:block lg:col-span-1 border border-(--color-border) bg-white rounded-xl p-5 h-fit shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-(--color-border)">
          <h3 className="font-bold text-lg text-(--color-text) flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-(--color-primary)" />
            Filtre
          </h3>
          {isFilterActive && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-(--color-error) font-semibold hover:underline"
            >
              Vymazať všetko
            </button>
          )}
        </div>
        {filterControlsJsx}
      </aside>

      {/* Main product catalog column */}
      <div className="lg:col-span-3 space-y-6">
        {/* Sort and Count bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-(--color-border) rounded-xl p-4 shadow-sm">
          <div className="text-sm text-(--color-text-muted)">
            Nájdených <strong className="text-(--color-text) font-semibold">{filteredProducts.length}</strong> produktov
            {isFilterActive && (
              <span className="ml-2 text-xs text-(--color-primary) bg-(--color-primary-light) px-2 py-0.5 rounded-full inline-block">
                aktívne filtre
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-(--color-text-muted) uppercase font-bold tracking-wider">Zoradiť:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pr-8 pl-3 py-1.5 text-xs font-semibold bg-gray-50 border border-(--color-border) rounded-lg outline-none cursor-pointer focus:border-(--color-primary) text-(--color-text) transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-(--color-text-light) pointer-events-none" />
            </div>
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-(--color-primary) text-white rounded-lg shadow hover:bg-(--color-primary-dark) transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtrovať
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center bg-gray-50 border border-dashed border-(--color-border) rounded-2xl"
              >
                <div className="max-w-md mx-auto space-y-3">
                  <SlidersHorizontal className="h-10 w-10 text-(--color-text-light) mx-auto" />
                  <h3 className="font-bold text-lg text-(--color-text)">Nenašli sa žiadne produkty</h3>
                  <p className="text-sm text-(--color-text-muted)">
                    Skúste zmeniť navolené parametre filtra alebo vyhľadávanú frázu.
                  </p>
                  <Button variant="secondary" size="sm" onClick={clearAllFilters}>
                    Zrušiť filtre a zobraziť všetko
                  </Button>
                </div>
              </m.div>
            ) : (
              <m.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
                role="list"
                aria-label="Zoznam produktov"
              >
                {filteredProducts.map((product, idx) => (
                  <m.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                    role="listitem"
                  >
                    <ProductCard product={product} />
                  </m.div>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Sheet */}
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl z-50 overflow-hidden flex flex-col shadow-2xl lg:hidden"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-(--color-border) bg-gray-50">
                <h3 className="font-bold text-lg text-(--color-text) flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5 text-(--color-primary)" />
                  Filtrovanie produktov
                </h3>
                <div className="flex items-center gap-3">
                  {isFilterActive && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-(--color-error) font-semibold hover:underline"
                    >
                      Vymazať
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full bg-gray-200 text-gray-600 hover:text-black"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {filterControlsJsx}
              </div>

              <div className="p-4 border-t border-(--color-border) bg-white">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Zobraziť {filteredProducts.length} produktov
                </Button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
