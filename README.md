# GrowMedica WordPress Dashboard

Headless **Next.js storefront + WordPress/WooCommerce CMS** pre GrowMedica.sk.

## Stav

| Oblasť | Stav |
|---|---|
| Storefront UI (Next.js 15, PWA, AI) | ✅ |
| WordPress/WooCommerce integrácia | ✅ `CMS_PROVIDER=wordpress` |
| Unified catalog provider | ✅ `src/lib/catalog/` |
| Košík + checkout BFF | ✅ WooCommerce session |
| Dashboard → WP admin iframe | ✅ `/dashboard` |
| ISR webhooks | ✅ mu-plugin + `/api/revalidate` |
| Playwright Woo testy | ✅ `yarn test:woo:integrity` |
| Shopify integrácia | 🟡 Legacy rollback (`CMS_PROVIDER=shopify`) |

## Quick Start

```bash
cd storefront
yarn install
cp .env.example .env.local
yarn dev
# http://localhost:5555
```

### WordPress režim (produkcia)

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.sk
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.sk/wp-admin
NEXT_PUBLIC_SITE_URL=https://growmedica.sk
```

### Lokálny WordPress (Docker)

```bash
docker compose up -d
# http://localhost:8080/wp-admin
```

Pozri [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md).

### Shopify režim (legacy rollback)

```bash
CMS_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
```

## Testy

```bash
yarn type-check
yarn test:integrity          # Shopify mock (default)
yarn test:woo:integrity      # WordPress mock
yarn build
yarn production:smoke        # curl + HTTP smoke
```

## Štruktúra

```
growmedica-wordpress-dashboard/
├── storefront/                 # Next.js app
│   ├── src/lib/catalog/        # Unified CMS API
│   ├── src/lib/wordpress/      # WooCommerce client + adapter
│   └── src/lib/shopify/        # Legacy rollback
├── wordpress/mu-plugins/       # CORS + ISR revalidation
├── docker-compose.yml
├── PRODUCTION_CHECKLIST.md
└── RELEASE_NOTES_v1.0-wordpress.md
```

## Dokumentácia

- [WordPress Setup](./WORDPRESS_SETUP.md)
- [Woo Cart BFF](./storefront/docs/WOO_CART.md)
- [Dashboard Deploy](./storefront/docs/DASHBOARD_DEPLOY.md)
- [WP Webhooks](./storefront/docs/WP_WEBHOOKS.md)
- [Diagnostics](./storefront/docs/DIAGNOSTICS.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)