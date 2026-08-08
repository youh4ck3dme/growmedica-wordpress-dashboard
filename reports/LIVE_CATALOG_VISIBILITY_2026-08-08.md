# Live catalog visibility — verification report

**Date:** 2026-08-08 (UTC)  
**Branch:** `cursor/verify-live-catalog-visibility-817c`  
**Agent:** Cloud Agent (report-only — no catalog code bug found)

---

## Executive summary

| Layer | Status | Notes |
|-------|--------|-------|
| CMS (`cms.growmedica.cz`) | ✅ Up | HTTP 200, Store API returns **496** publish products |
| Storefront BFF (`/api/products`) | ❌ Broken | HTTP **500** — Woo REST v3 fetch fails on Vercel |
| Storefront UI (`/produkty`, PDP) | ❌ Empty / 500 | Shell renders; catalog data unavailable |
| Catalog filtering code (`src/lib/**`) | ✅ OK | `status=publish`, out-of-stock marked via `availableForSale` |
| ISR mu-plugin + `/api/revalidate` | ⚠️ Partial | Endpoint live (401 without secret); CMS↔Vercel secret alignment **not verified** |

**Root cause (production):** Vercel project env almost certainly missing or invalid `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`, and/or `WORDPRESS_BASE_URL`. Not a filtering/mapping bug in `src/lib/catalog/**`.

**Runtime secrets in this Cloud Agent run:** `WOO_*`, `WORDPRESS_*` were **not injected** — authenticated Woo REST v3 count and `production:smoke` catalog probe could not be re-run with live credentials from the agent VM.

---

## Count comparison

| Source | Publish count | HTTP | Method |
|--------|---------------|------|--------|
| CMS Store API | **496** | 200 | `GET /wp-json/wc/store/v1/products?per_page=1` → `X-WP-Total: 496` |
| CMS Woo REST v3 | — | 401 | Requires `ck_`/`cs_` (expected without auth) |
| www `/api/products?limit=5` | **0** (error) | 500 | `{"error":"Failed to fetch products","products":[]}` |
| www `/produkty` UI | ~0 links | 200 | Page shell OK; no catalog product links in HTML |

---

## Sample product URLs (www)

Slugs from CMS Store API (confirmed publish on CMS):

| URL | HTTP | Expected |
|-----|------|----------|
| https://www.growmedica.cz/produkty/beauty-and-care-pack | **500** | 200 |
| https://www.growmedica.cz/produkty/balicek-travenie-komfort | **500** | 200 |
| https://www.growmedica.cz/produkty/balicek-krvny-obeh | **500** | 200 |
| https://www.growmedica.cz/produkty/balicek-po-antibiotikach | **500** | 200 |
| https://www.growmedica.cz/produkty/balicek-turistika-pohyb | **500** | 200 |
| https://www.growmedica.cz/produkty | **200** | 200 (with grid) |
| https://www.growmedica.cz/api/products?limit=5 | **500** | 200 + JSON |

---

## Draft / private / out-of-stock behavior (code review)

| Case | Behavior | Location |
|------|----------|----------|
| Draft / private | Excluded — Woo query uses `status: 'publish'` | `storefront/src/lib/wordpress/products.ts` |
| Out of stock | Shown in list; `availableForSale: false` when `stock_status !== 'instock'` | `storefront/src/lib/wordpress/adapter.ts` |
| Collection nav filter | Optional `inStockOnly` skips unavailable | `storefront/src/lib/wordpress/collection-nav.ts` |

CMS Store API sample (5 products): all `is_in_stock: true`. No evidence of draft leakage via public Store API.

---

## ISR status

| Check | Result |
|-------|--------|
| mu-plugin source | `wordpress/mu-plugins/growmedica-revalidate.php` — POST to `{storefront}/api/revalidate` with header `x-revalidation-secret` |
| www `/api/revalidate` POST (bad secret) | **401** Unauthorized — endpoint configured |
| CMS mu-plugin deployed | Present on server (from prior incident work) |
| CMS `GROWMEDICA_REVALIDATION_SECRET` | **Not verified** (no secrets in agent env) |
| Vercel `WORDPRESS_REVALIDATION_SECRET` | **Not verified** — must match CMS value |

**Diagnosis:** ISR wiring is structurally OK; stale cache is secondary until catalog fetch works. After Vercel env fix, owner should save one product on CMS and confirm `/api/revalidate` returns 200 in CMS debug log or via manual POST with valid secret.

---

## Smoke commands run

```bash
# CMS Store API total
curl -sI "https://cms.growmedica.cz/wp-json/wc/store/v1/products?per_page=1"
# → X-WP-Total: 496

# Production API
curl -s "https://www.growmedica.cz/api/products?limit=5"
# → HTTP 500

# Production smoke
PREVIEW_URL=https://www.growmedica.cz node scripts/production-smoke.mjs
# → FAIL on /api/products HTTP 500
```

---

## Gate (local, mock)

| Command | Result |
|---------|--------|
| `yarn type-check` | ✅ pass |
| `yarn lint` | ✅ pass (warnings only) |
| `yarn test:woo:integrity` | ✅ 14/14 pass |

---

## Owner handoff — Vercel env (no secret values)

Fix on **Vercel → Project `growmedica-wordpress-dashboard` (or active www project) → Settings → Environment Variables → Production**:

1. **`CMS_PROVIDER`** = `wordpress`
2. **`WORDPRESS_BASE_URL`** = `https://cms.growmedica.cz`
3. **`WOO_CONSUMER_KEY`** = valid `ck_…` from Woo → Settings → Advanced → REST API (Read access minimum)
4. **`WOO_CONSUMER_SECRET`** = matching `cs_…`
5. **`WOO_MOCK_MODE`** — must be **unset** or `0` (never `1` in production)
6. **`WORDPRESS_REVALIDATION_SECRET`** — same value as CMS `GROWMEDICA_REVALIDATION_SECRET` (WP option or env on WebSupport)
7. **`NEXT_PUBLIC_SITE_URL`** = `https://www.growmedica.cz`
8. **Redeploy** production after saving env (Vercel does not always hot-reload server env)

### Verification after fix

```bash
curl -s "https://www.growmedica.cz/api/products?limit=5" | jq '.count, .products[0].handle'
# expect: count ≥ 1, handle = real slug

PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
# expect: all endpoints ✅ including catalog probe with gid://woocommerce/… id

curl -sI "https://www.growmedica.cz/produkty/beauty-and-care-pack" | head -1
# expect: HTTP/2 200
```

### CMS-side ISR (optional, same secret)

On WebSupport / wp-config or env: `GROWMEDICA_REVALIDATION_SECRET` and `GROWMEDICA_STOREFRONT_URL=https://www.growmedica.cz`.

---

## Conclusion

**No code change required.** Production storefront cannot authenticate to Woo REST v3; CMS catalog is healthy (496 publish products). Owner must align Vercel Woo credentials and redeploy.
