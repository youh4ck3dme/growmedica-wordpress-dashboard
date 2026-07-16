# GrowMedica WordPress Dashboard

Headless **Next.js storefront + WordPress/WooCommerce CMS** pre GrowMedica (produkčná doména: **growmedica.cz**).

> **⛔ UI/UX FREEZE:** Storefront UI je uzamknutý. Ďalší vývoj = backend, integrácia, dashboard logika, testy.  
> Detail: [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) · [TODO.md](../TODO.md)

## Stav

| Oblasť | Stav |
|---|---|
| Storefront UI (Next.js 15, PWA, AI) | ✅ |
| Geo-lokalizácia UI (CS / SK / EN / DE) | ✅ |
| WordPress/WooCommerce integrácia | ✅ `CMS_PROVIDER=wordpress` |
| Unified catalog provider | ✅ `src/lib/catalog/` |
| Košík + checkout BFF | ✅ WooCommerce session |
| Dashboard → WP admin iframe | ✅ `/dashboard` |
| ISR webhooks | ✅ mu-plugin + `/api/revalidate` |
| Playwright Woo testy | ✅ `yarn test:woo:integrity` |
| Shopify integrácia | 🟡 Legacy rollback (`CMS_PROVIDER=shopify`) |

## Quick Start

Všetky `yarn` príkazy spúšťaj z priečinka **`storefront/`** (tam je `package.json`):

```bash
cd /cesta/k/projektu/growmedica-wordpress-dashboard/storefront
# alebo ak si už v growmedica-wordpress-dashboard/:
cd storefront

yarn install
cp .env.example .env.local
yarn dev
# http://localhost:5555
```

### WordPress režim (produkcia)

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin
NEXT_PUBLIC_SITE_URL=https://growmedica.cz
NEXT_PUBLIC_DEFAULT_LOCALE=cs
```

### i18n (CS / SK / EN / DE)

UI texty sa prekladajú podľa geo / cookie / `Accept-Language`. URL slugy (`/produkty`, `/kolekcie`) sa nemenia.

| Priorita | Zdroj |
|----------|--------|
| 1 | `?lang=cs\|sk\|en\|de` (nastaví cookie, redirect) |
| 2 | Cookie `growmedica_locale` (30 dní) |
| 3 | `x-vercel-ip-country` (CZ→cs, SK→sk, DE/AT/CH→de, ostatné→en) |
| 4 | `Accept-Language` (`cs` pred `sk`) |
| 5 | `NEXT_PUBLIC_DEFAULT_LOCALE` (fallback: `cs`) |

Prepínač v headeri ukazuje **len aktuálny locale**; po kliknutí dropdown CS / SK / EN / DE.

Detailná dokumentácia: [storefront/docs/I18N.md](./storefront/docs/I18N.md)

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

Z priečinka `storefront/`:

```bash
cd storefront
yarn type-check
yarn test:integrity          # Shopify mock (default) — 149+ testov
yarn test:i18n               # len i18n testy
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

- **[Development Guide](./storefront/docs/DEVELOPMENT.md)** — pravidlá vývoja, UI freeze, architektúra
- [TODO](../TODO.md) — aktuálne úlohy a fázy
- [i18n CS/SK/EN/DE](./storefront/docs/I18N.md)
- [WordPress Setup](./WORDPRESS_SETUP.md)
- [Woo Cart BFF](./storefront/docs/WOO_CART.md)
- [Dashboard Deploy](./storefront/docs/DASHBOARD_DEPLOY.md)
- [WP Webhooks](./storefront/docs/WP_WEBHOOKS.md)
- [Diagnostics](./storefront/docs/DIAGNOSTICS.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)