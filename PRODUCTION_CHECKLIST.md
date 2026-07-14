# Production cutover checklist — GrowMedica WordPress

## Vercel env (`growmedica-wordpress-dashboard`)

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `wordpress` |
| `WORDPRESS_BASE_URL` | `https://cms.growmedica.sk` |
| `WOO_CONSUMER_KEY` | `ck_...` (server-only) |
| `WOO_CONSUMER_SECRET` | `cs_...` (server-only) |
| `WORDPRESS_REVALIDATION_SECRET` | min. 16 znakov |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://cms.growmedica.sk/wp-admin` |
| `NEXT_PUBLIC_SITE_URL` | `https://growmedica.sk` |
| `MISTRAL_API_KEY` | produkčný kľúč |

## DNS

- [ ] `growmedica.sk` → Vercel
- [ ] `cms.growmedica.sk` → WordPress hosting (SSL)

## WordPress hosting

- [ ] WooCommerce REST API keys (Read/Write)
- [ ] Permalinky: `/produkt/%postname%/`
- [ ] Mu-plugins: `growmedica-cors.php`, `growmedica-revalidate.php`
- [ ] `GROWMEDICA_STOREFRONT_URL=https://growmedica.sk`
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