# GrowMedica WordPress Dashboard

Headless **Next.js storefront + WordPress/WooCommerce CMS** pre GrowMedica.sk.

Vznikol z [`growmedica-nextjs-storefront`](https://github.com/youh4ck3dme/growmedica-nextjs-storefront) s cieľom nahradiť Shopify za WordPress/WooCommerce ako source of truth pre produkty, kategórie a admin dashboard.

## Stav

| Oblasť | Stav |
|---|---|
| Storefront UI (Next.js 15, PWA, AI) | ✅ Zachované zo storefrontu |
| Shopify integrácia | 🟡 Dočasne aktívna (`CMS_PROVIDER=shopify`) |
| WordPress/WooCommerce vrstva | 🟢 Scaffold (`src/lib/wordpress/`) |
| Dashboard → WordPress admin | 🔲 Plánované (fáza 3) |

## Stack

- **Storefront:** Next.js 15, React 19, Tailwind 4, Serwist PWA, Mistral AI
- **CMS (cieľ):** WordPress + WooCommerce REST API v3
- **Dashboard (cieľ):** WordPress `/wp-admin` alebo custom plugin UI cez `/dashboard` iframe

## Quick Start

```bash
cd storefront
yarn install
cp .env.example .env.local
# Vyplň Shopify ALEBO WordPress premenné (pozri nižšie)
yarn dev
# http://localhost:5555
```

### WordPress režim

```bash
# .env.local
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.sk
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.sk/wp-admin
```

### Shopify režim (legacy, default)

```bash
CMS_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
```

## Štruktúra

```
growmedica-wordpress-dashboard/
├── storefront/                    # Next.js app
│   ├── src/lib/wordpress/         # WooCommerce REST client + adapter
│   ├── src/lib/cms.ts           # CMS provider switch
│   └── WORDPRESS_IMPLEMENTATION_PLAN.md
├── reports/
│   └── WORDPRESS_MIGRATION_PLAN.md
└── README.md
```

## Dokumentácia

- [WordPress Implementation Plan](./storefront/WORDPRESS_IMPLEMENTATION_PLAN.md)
- [Migration Plan](./reports/WORDPRESS_MIGRATION_PLAN.md)
- [UI/UX Design System](./storefront/UI_UX_DESIGN_SYSTEM.md)
- [Dashboard Deploy (iframe)](./storefront/docs/DASHBOARD_DEPLOY.md)

## Migrácia

1. Postav WordPress + WooCommerce hosting
2. Importuj produkty a 14 kategórií
3. Nastav `CMS_PROVIDER=wordpress` na preview
4. Prepni stránky z `lib/shopify/*` na `lib/wordpress/*`
5. Presmeruj `/dashboard` na WordPress admin

## Pôvodný projekt

Založené na **growmedica-nextjs-storefront** (júl 2026) — najnovší a najčistejší GrowMedica codebase s dizajn systémom, PWA a Mistral AI.