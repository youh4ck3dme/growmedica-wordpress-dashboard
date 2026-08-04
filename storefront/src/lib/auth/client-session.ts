'use client'

import { CUSTOMER_LOGGED_IN_COOKIE } from '@/lib/auth/constants'

/** Client-safe login check via the non-httpOnly flag cookie set on login/register.
 * Does not verify the real session — server routes always re-check the signed
 * httpOnly cookie, so this is only used to gate client-only UX (e.g. wishlist). */
export function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false
  try {
    return document.cookie
      .split('; ')
      .some((entry) => entry.startsWith(`${CUSTOMER_LOGGED_IN_COOKIE}=`))
  } catch {
    return false
  }
}
