/**
 * Browser-side cart helpers — timeout + safe JSON parsing so hung/404 responses
 * cannot leave Add to cart buttons stuck on "loading".
 */

const CART_ADD_TIMEOUT_MS = 25_000

export type CartAddResult = {
  count: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readJsonBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('Cart API returned a non-JSON response')
  }
  return response.json()
}

export async function addToCartRequest(
  variantId: string,
  quantity = 1,
  fallbackError = 'Nepodarilo sa pridať do košíka',
): Promise<CartAddResult> {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId, quantity }),
    signal: AbortSignal.timeout(CART_ADD_TIMEOUT_MS),
  })

  const payload = await readJsonBody(response).catch(() => null)

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallbackError
    throw new Error(message)
  }

  if (!isRecord(payload) || typeof payload.count !== 'number') {
    throw new Error(fallbackError)
  }

  return { count: payload.count }
}

export function dispatchCartCountUpdated(count: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: count }))
}
