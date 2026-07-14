# Production cutover checklist — GrowMedica

**Aktualizované:** 14. júl 2026  
**UI/UX:** Storefront UI sa pri cutoveri nemení — len infra, env a dáta.

**Aktuálna priorita:** live katalóg zo **Shopify** (`growmedica.myshopify.com`). WordPress produkcia (`cms.growmedica.cz`) je odložená.

Detail: [storefront/docs/SHOPIFY_LIVE.md](./storefront/docs/SHOPIFY_LIVE.md)

## Vercel env — Shopify live (`growmedica-wordpress-dashboard`)

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `shopify` |
| `SHOPIFY_STORE_DOMAIN` | `growmedica.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront API token (**nie** `shpat_`) — alebo `SHOPIFY_STOREFRONT_TOKENLESS=1` |
| `SHOPIFY_REVALIDATION_SECRET` | min. 16 znakov |
| `SHOPIFY_API_VERSION` | `2025-01` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.growmedica.cz` |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://growmedica-nexus.lovable.app/admin` |
| `NEXT_PUBLIC_DASHBOARD_MODE` | `hybrid` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `sk` |
| `MISTRAL_API_KEY` | produkčný kľúč (voliteľné) |
| `DASHBOARD_AGENT_SECRET` | min. 16 znakov |

**Odstrániť z Vercel:** `SHOPIFY_MOCK_MODE`, `WOO_MOCK_MODE` (pri Shopify režime).

Skript:

```bash
cd storefront
SHOPIFY_STOREFRONT_ACCESS_TOKEN=... ./scripts/set-shopify-vercel-env.sh --deploy
```

## Vercel env — WordPress (odložené / rollback)

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `wordpress` |
| `WORDPRESS_BASE_URL` | `https://cms.growmedica.cz` |
| `WOO_CONSUMER_KEY` | `ck_...` (server-only) |
| `WOO_CONSUMER_SECRET` | `cs_...` (server-only) |
| `WORDPRESS_REVALIDATION_SECRET` | min. 16 znakov |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://cms.growmedica.cz/wp-admin` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.growmedica.cz` |

## DNS

- [x] Domény pridané na Vercel projekt `growmedica-wordpress-dashboard` (`growmedica.cz`, `www.growmedica.cz`)
- [ ] **WebSupport DNS** — zmeniť A `@` z `37.9.175.131` na `76.76.21.21` + CNAME `www` → `cname.vercel-dns.com`
- [ ] Overiť SSL po propagácii: `curl -I https://growmedica.cz`
- [ ] `cms.growmedica.cz` → WordPress hosting (SSL)

Skript: `cd storefront && ./scripts/setup-growmedica-cz-domain.sh --deploy`

## WordPress hosting

- [ ] WooCommerce REST API keys (Read/Write)
- [ ] Permalinky: `/produkt/%postname%/`
- [ ] Mu-plugins: `growmedica-cors.php`, `growmedica-revalidate.php`
- [ ] `GROWMEDICA_STOREFRONT_URL=https://growmedica.cz`
- [ ] `GROWMEDICA_REVALIDATION_SECRET` = rovnaký ako `WORDPRESS_REVALIDATION_SECRET`
- [ ] CSP `frame-ancestors` pre wp-admin embed

## Import dát

```bash
cd storefront
yarn import:categories
yarn import:products
```

## Pre-deploy overenie (Shopify)

```bash
cd storefront
yarn setup:env              # lokálne — Storefront token
yarn shopify:smoke
yarn shopify:collections-audit
yarn type-check
yarn build
yarn test:integrity
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s https://www.growmedica.cz/api/products | head -c 400
```

## Nexus admin — Shopify integrácia

V **growmedica-nexus.lovable.app** → Shopify formulár:

| Pole | Hodnota |
|------|---------|
| Store domain | `growmedica.myshopify.com` |
| Admin access token | `shpat_…` |
| Storefront access token | Storefront token (nie `shpat_`) |
| API verzia | `2025-01` |

Po uložení: **test pripojenia** v Nexus UI.

## Rollback

**Na WordPress mock:** `CMS_PROVIDER=wordpress`, `WOO_MOCK_MODE=1`, redeploy.

**Späť na Shopify:** `./scripts/set-shopify-vercel-env.sh --deploy`

## Súvisiace dokumenty

- [TODO.md](../TODO.md) — fázy vývoja
- [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) — vývojársky návod + UI freeze
- [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md) — lokálny WP