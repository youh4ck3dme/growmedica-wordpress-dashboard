/**
 * WooCommerce Admin REST client for import scripts.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function loadEnvLocal(root = process.cwd()) {
  const envPath = join(root, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

export function getWooConfig() {
  const baseUrl = process.env.WORDPRESS_BASE_URL
  const consumerKey = process.env.WOO_CONSUMER_KEY
  const consumerSecret = process.env.WOO_CONSUMER_SECRET
  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error('Missing WORDPRESS_BASE_URL, WOO_CONSUMER_KEY, or WOO_CONSUMER_SECRET in .env.local')
  }
  return { baseUrl, consumerKey, consumerSecret }
}

function buildUrl(path, params = {}) {
  const { baseUrl, consumerKey, consumerSecret } = getWooConfig()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`/wp-json/wc/v3${normalized}`, baseUrl)
  url.searchParams.set('consumer_key', consumerKey)
  url.searchParams.set('consumer_secret', consumerSecret)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url
}

export async function wooGet(path, params) {
  const response = await fetch(buildUrl(path, params).toString())
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

export async function wooPost(path, body) {
  const response = await fetch(buildUrl(path).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`POST ${path} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

export async function wooPut(path, body) {
  const response = await fetch(buildUrl(path).toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`PUT ${path} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

/** Paginate Woo REST list endpoints (max 100 per page). */
export async function wooGetAll(path, params = {}) {
  const perPage = Number(params.per_page ?? 100)
  let page = 1
  const all = []
  for (;;) {
    const batch = await wooGet(path, { ...params, per_page: perPage, page })
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < perPage) break
    page += 1
    if (page > 100) break
  }
  return all
}
