'use client'

import { useState } from 'react'
import Link from 'next/link'

import type { Cart } from '@/lib/shopify/types'

interface InteractiveCartProps {
  initialCart: Cart
}

export function InteractiveCart({ initialCart }: InteractiveCartProps) {
  const [cart, setCart] = useState<Cart>(initialCart)
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null)
  
  // Discount states
  const [discountInput, setDiscountInput] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null)

  const lines = cart.lines.edges.map((e) => e.node) ?? []

  async function handleUpdateQuantity(lineId: string, currentQty: number, delta: number) {
    const newQty = currentQty + delta
    if (newQty < 1) return

    setUpdatingLineId(lineId)
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, quantity: newQty }),
      })

      if (res.ok) {
        const data = (await res.json()) as { cart: Cart; count: number }
        setCart(data.cart)
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }
    } catch (err) {
      console.error('Failed to update quantity', err)
    } finally {
      setUpdatingLineId(null)
    }
  }

  async function handleRemoveItem(lineId: string) {
    setUpdatingLineId(lineId)
    try {
      const res = await fetch(`/api/cart?lineId=${encodeURIComponent(lineId)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const data = (await res.json()) as { cart: Cart; count: number }
        setCart(data.cart)
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }
    } catch (err) {
      console.error('Failed to remove item', err)
    } finally {
      setUpdatingLineId(null)
    }
  }

  async function handleApplyDiscount(e: React.FormEvent) {
    e.preventDefault()
    const code = discountInput.trim()
    if (!code) return

    setApplyingDiscount(true)
    setDiscountError(null)
    setDiscountSuccess(null)

    try {
      const res = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCode: code }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Kód sa nepodarilo uplatniť.')
      }

      const data = (await res.json()) as { cart: Cart; count: number }
      setCart(data.cart)
      window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))

      const isApplied = data.cart.discountCodes?.some(
        (dc) => dc.code.toUpperCase() === code.toUpperCase() && dc.applicable
      )
      if (isApplied) {
        setDiscountSuccess('Zľavový kód bol úspešne uplatnený.')
        setDiscountInput('')
      } else {
        setDiscountError('Zadaný zľavový kód nie je platný pre položky v košíku.')
      }
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Nastala chyba pri uplatnení kódu.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  async function handleRemoveDiscount(code: string) {
    setApplyingDiscount(true)
    setDiscountError(null)
    setDiscountSuccess(null)

    try {
      const res = await fetch('/api/cart/discount', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Zľavu sa nepodarilo odstrániť.')
      }

      const data = (await res.json()) as { cart: Cart; count: number }
      setCart(data.cart)
      window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      setDiscountSuccess('Zľava bola odstránená.')
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Nastala chyba pri odstraňovaní zľavy.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  const subtotalVal = parseFloat(cart.cost.subtotalAmount.amount)
  const totalVal = parseFloat(cart.cost.totalAmount.amount)
  const discountVal = subtotalVal - totalVal
  const hasDiscount = discountVal > 0.01

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="mb-6">
          <svg className="h-16 w-16 text-(--color-text-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-(--color-text) mb-2">Košík je prázdny</h2>
        <p className="text-(--color-text-muted) max-w-md mb-6">Pridajte produkty a pokračujte v nákupe.</p>
        <Link href="/produkty" className="btn btn-primary">
          Pokračovať v nákupe
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart lines */}
      <div className="lg:col-span-2 space-y-4">
        {lines.map((line) => {
          const isLineUpdating = updatingLineId === line.id
          return (
            <div
              key={line.id}
              className={`flex gap-4 p-4 bg-white rounded-xl border border-(--color-border) transition-opacity duration-200 ${
                isLineUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Product image */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-(--color-surface-2) shrink-0 border border-(--color-border)">
                {line.merchandise.product.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-(--color-text-muted) text-xs">
                    Obrázok nie je k dispozícii
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/produkty/${line.merchandise.product.handle}`}
                    className="font-medium text-(--color-text) hover:text-(--color-primary) transition-colors block truncate"
                  >
                    {line.merchandise.product.title}
                  </Link>
                  <p className="text-sm text-(--color-text-muted) mt-0.5">
                    {line.merchandise.selectedOptions
                      .filter((o) => o.name !== 'Title')
                      .map((o) => o.value)
                      .join(' · ')}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-(--color-border) rounded-lg bg-(--color-surface-2)">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(line.id, line.quantity, -1)}
                      disabled={line.quantity <= 1}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-(--color-primary) disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                      aria-label="Znížiť množstvo"
                    >
                      –
                    </button>
                    <span className="px-3 py-1 text-sm font-medium tabular-nums min-w-[2.5rem] text-center bg-white border-x border-(--color-border)">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(line.id, line.quantity, 1)}
                      className="px-2.5 py-1 text-sm font-semibold hover:text-(--color-primary) transition-colors"
                      aria-label="Zvýšiť množstvo"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(line.id)}
                    className="text-xs text-(--color-error) hover:underline ml-3 font-medium"
                    aria-label="Odstrániť položku z košíka"
                  >
                    Odstrániť z košíka
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0 flex flex-col justify-between items-end">
                <p className="font-semibold text-(--color-text)">
                  {line.cost.totalAmount.amount} {line.cost.totalAmount.currencyCode}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-(--color-border) p-6 sticky top-24">
          <h2 className="font-semibold text-(--color-text) text-lg mb-4">Súhrn nákupu</h2>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-(--color-text-muted)">Medzisúčet</span>
              <span className="font-medium">
                {cart.cost.subtotalAmount.amount} {cart.cost.subtotalAmount.currencyCode}
              </span>
            </div>
            
            {hasDiscount && (
              <div className="flex justify-between text-sm text-(--color-primary) font-semibold">
                <span>Zľava</span>
                <span>
                  -{discountVal.toFixed(2)} {cart.cost.subtotalAmount.currencyCode}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-(--color-text-muted)">Doprava</span>
              <span className="text-(--color-success) font-medium">Vypočíta sa v pokladni</span>
            </div>
          </div>

          {/* Discount code entry */}
          <div className="mt-4 pt-4 border-t border-(--color-border)">
            <form onSubmit={handleApplyDiscount} className="flex gap-2">
              <input
                type="text"
                id="discount-input"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="Zľavový kód"
                disabled={applyingDiscount}
                className="flex-1 px-3 py-2 border border-(--color-border) rounded-lg text-sm focus:outline-none focus:border-(--color-primary) disabled:opacity-50"
              />
              <button
                type="submit"
                id="apply-discount-btn"
                disabled={applyingDiscount || !discountInput.trim()}
                className="btn btn-secondary btn-sm px-4"
              >
                {applyingDiscount ? '...' : 'Použiť'}
              </button>
            </form>
            {discountError && (
              <p className="text-xs text-(--color-error) mt-1.5" id="discount-error">{discountError}</p>
            )}
            {discountSuccess && (
              <p className="text-xs text-(--color-primary) mt-1.5" id="discount-success">{discountSuccess}</p>
            )}

            {cart.discountCodes && cart.discountCodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2" id="applied-discounts">
                {cart.discountCodes.map((dc) => (
                  <div
                    key={dc.code}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      dc.applicable
                        ? 'bg-(--color-primary-light) text-(--color-primary-dark)'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span>🏷️ {dc.code}</span>
                    {dc.applicable && <span className="text-[10px] opacity-75">(Aplikovaný)</span>}
                    {!dc.applicable && <span className="text-[10px] opacity-75">(Neplatný)</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveDiscount(dc.code)}
                      disabled={applyingDiscount}
                      className="hover:text-red-700 transition-colors font-bold ml-1"
                      id="remove-discount-btn"
                      aria-label={`Odstrániť kód ${dc.code}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-(--color-border) pt-4 mt-4 mb-6">
            <div className="flex justify-between font-bold text-(--color-text)">
              <span>Celkom</span>
              <span id="cart-total-price">
                {cart.cost.totalAmount.amount} {cart.cost.totalAmount.currencyCode}
              </span>
            </div>
          </div>

          {/* Checkout redirect */}
          {cart.checkoutUrl && (
            <a
              href={cart.checkoutUrl}
              id="checkout-btn"
              className="btn btn-primary btn-lg btn-full text-center"
              rel="noopener"
            >
              Pokračovať do pokladne
            </a>
          )}

          <Link href="/produkty" className="btn btn-ghost btn-full mt-3 text-center">
            Pokračovať v nákupe
          </Link>
        </div>
      </div>
    </div>
  )
}
