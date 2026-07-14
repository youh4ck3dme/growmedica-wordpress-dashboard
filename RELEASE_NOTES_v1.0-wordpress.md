# Release Notes v1.0 — WordPress/WooCommerce

**Dátum:** júl 2026  
**Repozitár:** `youh4ck3dme/growmedica-wordpress-dashboard`

## Highlights

- Headless Next.js 15 storefront s WooCommerce REST API v3 ako source of truth
- Unified `catalog/*` provider switch (`CMS_PROVIDER=shopify|wordpress`)
- WooCommerce BFF košík s checkout redirect na WP
- WordPress admin iframe na `/dashboard`
- ISR revalidácia cez mu-plugin webhook (`woo-product-*`, `woo-category-*` tagy)
- Mistral AI asistent číta produkty z `catalog/*`
- 14/14 kategórií s WebP bannermi a import skriptmi
- Playwright sada: `yarn test:woo:integrity`, `yarn production:smoke`

## Breaking changes

- Produkčný default: `CMS_PROVIDER=wordpress`
- `NEXT_PUBLIC_DASHBOARD_URL` → `https://cms.growmedica.cz/wp-admin`
- growmedica-nexus označený ako legacy fallback

## Migration

1. Postavte WordPress + WooCommerce (`docker-compose.yml` / hosting)
2. Importujte kategórie a produkty (`yarn import:categories`, `yarn import:products`)
3. Nastavte Vercel env podľa `PRODUCTION_CHECKLIST.md`
4. Overte `yarn build` + `yarn test:woo:integrity`