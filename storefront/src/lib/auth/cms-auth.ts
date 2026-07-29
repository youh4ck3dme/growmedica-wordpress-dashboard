import { getWordPressEnv } from '@/lib/env'
import { getCmsAuthSecret } from '@/lib/auth/session'
import { isWooMockMode } from '@/lib/wordpress/mock'

export type CmsCustomerPayload = {
  customerId: number
  email: string
  name: string
  billing?: Record<string, string>
  shipping?: Record<string, string>
}

export type CustomerOrderSummary = {
  id: number
  number: string
  status: string
  total: string
  currency: string
  dateCreated: string
}

async function cmsAuthFetch<T>(
  path: string,
  init: RequestInit & { method?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const { WORDPRESS_BASE_URL } = getWordPressEnv()
  const secret = getCmsAuthSecret()
  if (!secret || secret.length < 16) {
    return { ok: false, status: 503, message: 'Auth is not configured (missing AUTH_SESSION_SECRET).' }
  }

  const url = `${WORDPRESS_BASE_URL.replace(/\/$/, '')}/wp-json/growmedica/v1${path}`
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-GrowMedica-Auth-Secret': secret,
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    })
    const raw = await response.text()
    let body: unknown = null
    try {
      body = raw ? JSON.parse(raw) : null
    } catch {
      body = { message: raw.slice(0, 200) }
    }
    if (!response.ok) {
      const message =
        typeof body === 'object' && body && 'message' in body && typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : `Auth request failed (${response.status})`
      return { ok: false, status: response.status, message }
    }
    return { ok: true, data: body as T }
  } catch (err) {
    return {
      ok: false,
      status: 502,
      message: err instanceof Error ? err.message : 'CMS auth unreachable',
    }
  }
}

export async function cmsLogin(email: string, password: string) {
  if (isWooMockMode()) {
    return {
      ok: true as const,
      data: {
        customerId: 1,
        email: email.trim(),
        name: email.split('@')[0] || 'Demo zákazník',
        billing: {
          first_name: 'Demo',
          last_name: 'Zákazník',
          address_1: 'Hlavná 1',
          city: 'Bratislava',
          postcode: '811 01',
          country: 'SK',
          email: email.trim(),
        },
        shipping: {},
      } satisfies CmsCustomerPayload,
    }
  }
  return cmsAuthFetch<CmsCustomerPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function cmsRegister(input: {
  email: string
  password: string
  firstName?: string
  lastName?: string
}) {
  if (isWooMockMode()) {
    return cmsLogin(input.email, input.password)
  }
  return cmsAuthFetch<CmsCustomerPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function cmsGetCustomer(customerId: number) {
  if (isWooMockMode()) {
    return {
      ok: true as const,
      data: {
        customerId,
        email: 'demo@growmedica.cz',
        name: 'Demo zákazník',
        billing: {
          first_name: 'Demo',
          last_name: 'Zákazník',
          address_1: 'Hlavná 1',
          city: 'Bratislava',
          postcode: '811 01',
          country: 'SK',
        },
        shipping: {},
      } satisfies CmsCustomerPayload,
    }
  }
  return cmsAuthFetch<CmsCustomerPayload>(`/auth/me?customerId=${customerId}`, { method: 'GET' })
}

export async function fetchCustomerOrders(customerId: number): Promise<CustomerOrderSummary[]> {
  if (isWooMockMode()) {
    return [
      {
        id: 1001,
        number: '1001',
        status: 'completed',
        total: '49.90',
        currency: 'EUR',
        dateCreated: '2026-06-01T10:00:00',
      },
    ]
  }

  const { WORDPRESS_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET } = getWordPressEnv()
  const url = new URL(`${WORDPRESS_BASE_URL.replace(/\/$/, '')}/wp-json/wc/v3/orders`)
  url.searchParams.set('customer', String(customerId))
  url.searchParams.set('per_page', '10')
  url.searchParams.set('orderby', 'date')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('consumer_key', WOO_CONSUMER_KEY)
  url.searchParams.set('consumer_secret', WOO_CONSUMER_SECRET)

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    const orders = (await response.json()) as Array<{
      id: number
      number: string
      status: string
      total: string
      currency: string
      date_created?: string
    }>
    if (!Array.isArray(orders)) return []
    return orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      currency: o.currency,
      dateCreated: o.date_created ?? '',
    }))
  } catch {
    return []
  }
}
