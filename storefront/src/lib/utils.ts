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

// ─── Sanitize HTML (CMS bodyHtml) ────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
  'h4',
  'h5',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
}

function isSafeHref(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return false
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('data:')) {
    return false
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  )
}

/**
 * Allow-list HTML sanitizer for CMS product HTML (no scripts/event handlers).
 * Prefer this over regex-only stripping — attributes like onclick='…' are removed.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  let cleaned = html.replace(/\0/g, '')
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  cleaned = cleaned.replace(
    /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base|svg|math|video|audio|source|track)(\s[^>]*)?>/gi,
    '',
  )

  return cleaned.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase()
    const isClosing = match.startsWith('</')
    if (!ALLOWED_TAGS.has(tag)) return ''
    if (isClosing) return `</${tag}>`

    const allowed = ALLOWED_ATTRS[tag]
    if (!allowed || !rawAttrs.trim()) return `<${tag}>`

    const attrs: string[] = []
    const attrRe = /([a-z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrRe.exec(rawAttrs)) !== null) {
      const name = attrMatch[1].toLowerCase()
      if (name.startsWith('on')) continue
      if (!allowed.has(name)) continue
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? ''
      if (name === 'href' || name === 'src') {
        if (!isSafeHref(value)) continue
      }
      if (name === 'target' && value !== '_blank' && value !== '_self') continue
      const safe = value.replace(/"/g, '&quot;')
      attrs.push(`${name}="${safe}"`)
    }

    if (tag === 'a' && attrs.some((a) => a.startsWith('target="_blank"'))) {
      if (!attrs.some((a) => a.startsWith('rel='))) {
        attrs.push('rel="noopener noreferrer"')
      }
    }

    return attrs.length ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`
  })
}
