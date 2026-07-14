/**
 * Utility functions
 */

import type { Money } from './shopify/types'

// ─── Price formatting ─────────────────────────────────────────────────────────

export function formatMoney(money: Money): string {
  const amount = parseFloat(money.amount)
  const formattedAmount = amount.toFixed(2).replace('.', ',')
  const currency = money.currencyCode === 'EUR' ? '€' : money.currencyCode

  // Keep price text deterministic across Node and browsers to avoid hydration
  // mismatches from locale-specific non-breaking spaces or currency placement.
  return `${formattedAmount} ${currency}`
}

export function formatPrice(amount: string, currencyCode: string): string {
  return formatMoney({ amount, currencyCode })
}

// ─── Discount calculation ─────────────────────────────────────────────────────

export function getDiscountPercentage(price: Money, compareAtPrice: Money | null): number | null {
  if (!compareAtPrice) return null
  const priceAmount = parseFloat(price.amount)
  const compareAmount = parseFloat(compareAtPrice.amount)
  if (compareAmount <= priceAmount) return null
  return Math.round(((compareAmount - priceAmount) / compareAmount) * 100)
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function getProductUrl(handle: string): string {
  return `/produkty/${handle}`
}

export function getCollectionUrl(handle: string): string {
  return `/kolekcie/${handle}`
}

// ─── Image helpers ────────────────────────────────────────────────────────────

/**
 * Resize Shopify CDN image URL
 * @example getSizedShopifyImage('https://cdn.shopify.com/...image.jpg', 800, 800)
 */
export function getSizedShopifyImage(
  url: string,
  width: number,
  height?: number
): string {
  if (!url) return url

  const [base, query] = url.split('?')
  const params = new URLSearchParams(query ?? '')

  const widthParam = `${width}x${height ?? ''}`
  const sizedUrl = base.replace(/(\.[a-z]+)$/, `_${widthParam}$1`)

  return params.toString() ? `${sizedUrl}?${params}` : sizedUrl
}

// ─── String helpers ───────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
}

// ─── Class name utility (tiny cn replacement) ─────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Cart helpers ─────────────────────────────────────────────────────────────

export function getVariantId(variantGlobalId: string): string {
  // Shopify global IDs: gid://shopify/ProductVariant/12345
  return variantGlobalId.split('/').pop() ?? variantGlobalId
}

// ─── Sanitize HTML (Shopify bodyHtml) ────────────────────────────────────────

/**
 * Minimal allow-list sanitization for Shopify bodyHtml
 * Only allows basic formatting tags — no scripts, iframes, forms
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}
