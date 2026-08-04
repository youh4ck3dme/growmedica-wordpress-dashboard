// Cookie name constants shared by server (src/lib/auth/session.ts) and client
// (src/lib/auth/client-session.ts) code. Kept dependency-free so it is safe to
// import from client components.

export const CUSTOMER_SESSION_COOKIE = 'gm_customer_session'
export const CUSTOMER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30 // 30 days

/** Non-httpOnly companion flag so client components can check login state
 * without a round trip. Carries no session data/capability by itself —
 * every authenticated API route still verifies the signed httpOnly cookie. */
export const CUSTOMER_LOGGED_IN_COOKIE = 'gm_customer_logged_in'
