# Production cutover checklist — GrowMedica WordPress

**Aktualizované:** 14. júl 2026  
**UI/UX:** Storefront UI sa pri cutoveri nemení — len infra, env a dáta.

## Vercel env (`growmedica-wordpress-dashboard`)

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `wordpress` |
| `WORDPRESS_BASE_URL` | `https://cms.growmedica.cz` |
| `WOO_CONSUMER_KEY` | `ck_...` (server-only) |
| `WOO_CONSUMER_SECRET` | `cs_...` (server-only) |
| `WORDPRESS_REVALIDATION_SECRET` | min. 16 znakov |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://cms.growmedica.cz/wp-admin` |
| `NEXT_PUBLIC_SITE_URL` | `https://growmedica.cz` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `sk` (fallback; primárne geo podľa IP) |
| `MISTRAL_API_KEY` | produkčný kľúč |

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

## Pre-deploy overenie

```bash
cd storefront
yarn type-check
yarn build
yarn test:integrity
CMS_PROVIDER=wordpress WOO_MOCK_MODE=1 yarn test:woo:integrity
PREVIEW_URL=https://<preview-url> node scripts/production-smoke.mjs
```

## Rollback

Nastavte `CMS_PROVIDER=shopify` a Shopify env na Vercel. Shopify vrstva zostáva v `src/lib/shopify/` ako legacy fallback.

## Súvisiace dokumenty

- [TODO.md](../TODO.md) — fázy vývoja
- [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) — vývojársky návod + UI freeze
- [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md) — lokálny WP