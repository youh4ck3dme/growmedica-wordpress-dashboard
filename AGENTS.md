# AGENTS.md

## Cursor Cloud specific instructions

### Project layout
- The application is a single Next.js 15 / React 19 storefront living in `storefront/` (GrowMedica, Slovak health-supplements e-commerce). The repo root only holds docs (`reports/`, `README.md`) and a legacy `.env.local.example` for an unrelated PHP/Docker stack — ignore that root example for the storefront.
- Package manager is **Yarn 1** (see `storefront/yarn.lock`). Node 22 is fine. Run all app commands from `storefront/`.

### Local env (required to run `yarn dev` / `yarn build`)
`src/lib/env.ts` validates Shopify env vars at import, so the app will not boot without them. There are no real credentials in this environment, so run everything in **mock mode**. The dev `.env.local` is gitignored and will not arrive via a PR — if `storefront/.env.local` is missing, recreate it with these mock values (no real secrets needed):

```
SHOPIFY_MOCK_MODE=1
SHOPIFY_STORE_DOMAIN=mock-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=mock-storefront-token
SHOPIFY_REVALIDATION_SECRET=mock-revalidation-secret-123456
SHOPIFY_API_VERSION=2025-01
NEXT_PUBLIC_SITE_URL=http://localhost:5555
MISTRAL_MOCK_MODE=1
MISTRAL_API_KEY=mock-mistral-api-key
MISTRAL_MODEL=mistral-large-latest
```

In mock mode `src/lib/shopify/mock.ts` serves deterministic products/collections/cart, so no network/Shopify access is required. Real Shopify/Mistral credentials are only needed for production data or the optional `scripts/*.mjs` Shopify Admin helpers.

### Commands (run in `storefront/`)
Standard scripts are in `storefront/package.json`; the common ones:
- `yarn dev` — dev server on port **5555** (Turbopack).
- `yarn lint` / `yarn type-check` — ESLint (warnings only) / `tsc --noEmit`.
- `yarn build` — production build (works fully in mock mode).
- `yarn test:integrity` — Playwright integrity suite; it boots its own dev server on port 5557 and injects mock env, so it does NOT need `.env.local`.

### Gotchas
- `yarn test:integrity` includes `tests/integrity/database-schema.spec.ts`, which reads `../../../wpbox/schema/*.yaml` and `../../../wpbox/database/*.yaml`. That `wpbox/` directory is NOT part of this repo, so those 3 tests fail with `ENOENT` while the other 131 storefront tests pass. This is expected in a standalone checkout — not a regression.
- Cart state is server-side: `/api/cart/add` stores the mock cart in-memory and sets an httpOnly `growmedical_cart_id` cookie. The `/kosik` page reads the cart from that cookie on a full server render, so to verify the cart in a browser, add an item then do a full navigation/reload of `/kosik` (the header badge updates client-side and may lag until reload).
- Playwright Chromium browsers are already available in this environment; `yarn test:integrity` runs without an extra browser install step.
