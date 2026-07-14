# WORDPRESS IMPLEMENTATION PLAN — GrowMedica Headless Storefront + Dashboard

**Aktualizované:** 14. júl 2026  
**UI/UX:** Storefront UI je uzamknutý — migrácia je len backend/integrácia. Pozri [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## Cieľ

Nahradiť Shopify ako source of truth za **WordPress + WooCommerce** a prepojiť existujúci Next.js storefront s WP admin dashboardom.

## Princípy

- **WordPress/WooCommerce** = produkty, kategórie, sklad, objednávky, obsah
- **Next.js** = presentation layer (UI, SEO, PWA, AI asistent)
- **Shopify vrstva** = dočasne zachovaná pre postupnú migráciu (`CMS_PROVIDER=shopify`)
- **Admin** = WordPress `/wp-admin` alebo custom WP plugin dashboard (namiesto growmedica-nexus)
- **Checkout** = WooCommerce native checkout alebo headless cart → WooCommerce order API

---

## Tech Stack

| Vrstva | Technológia |
|---|---|
| Storefront | Next.js 15 (App Router), TypeScript, Tailwind 4 |
| CMS | WordPress 6.x + WooCommerce 9.x |
| API | WooCommerce REST API v3 (`/wp-json/wc/v3`) |
| Alternatíva | WPGraphQL + WooGraphQL (fáza 2) |
| AI | Mistral (zachované zo storefrontu) |
| PWA | Serwist |
| Deployment | Vercel (storefront) + WP hosting (CMS) |

---

## Fázy migrácie

### Fáza 0 — Scaffold ✅

- [x] Fork z `growmedica-nextjs-storefront`
- [x] `src/lib/wordpress/` — WooCommerce client, adapter, produkty, kategórie
- [x] `src/lib/cms.ts` — prepínač `CMS_PROVIDER`
- [x] `src/lib/catalog/*` — unified catalog API
- [x] Env validácia v `env.ts`
- [x] Route handlers: `/api/revalidate` pre WP webhooks

### Fáza 1 — Katalóg ✅ (mock + lokálny WP)

- [x] `WORDPRESS_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET` env
- [x] `CMS_PROVIDER=wordpress` na preview / lokál
- [x] Mapovanie 14 kategórií → WooCommerce product categories
- [x] Import skripty: `yarn import:categories`, `yarn import:products`
- [x] Playwright testy s WooCommerce mock/fixture (`yarn test:woo:integrity`)
- [ ] **Live produkcia** — import na `cms.growmedica.cz`

### Fáza 2 — Košík a checkout 🟡

- [x] WooCommerce BFF pre cart session (`src/lib/wordpress/cart.ts`, `/api/cart/*`)
- [x] Unified cart cez `catalog/cart.ts`
- [ ] Live Woo cart session na produkcii
- [ ] Checkout redirect na WooCommerce checkout URL
- [ ] Order webhooks → revalidácia ISR (live overenie)

### Fáza 3 — Dashboard ✅ (hybrid)

- [x] `/dashboard` — Mistral AI Agent + WP admin iframe (hybrid tabs)
- [x] `src/lib/dashboard-agent/*` — tools, audit log, export
- [x] CSP `frame-src` v `next.config.ts`
- [x] Middleware `x-dashboard-route` — bez shop chrome
- [ ] Live WP iframe auth na `cms.growmedica.cz`
- [ ] Deprecate growmedica-nexus (legacy rollback)

### Fáza 4 — Cutover 🔲

- [ ] Production `CMS_PROVIDER=wordpress` + `WOO_MOCK_MODE=0`
- [ ] DNS: `growmedica.cz` → Vercel ✅, `cms.growmedica.cz` → WP hosting
- [ ] Odstránenie Shopify env po stabilnom WP provozu (voliteľné)

---

## Env premenné

```bash
# CMS provider: shopify | wordpress (auto-detect ak chýba)
CMS_PROVIDER=wordpress

# WordPress / WooCommerce (server-only)
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=your-random-webhook-secret-min-16-chars

# Dashboard iframe (WordPress admin alebo custom plugin route)
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin

# Zachované zo storefrontu
NEXT_PUBLIC_SITE_URL=https://growmedica.cz
MISTRAL_API_KEY=...
```

---

## Súbory (nové)

```
storefront/src/lib/
├── cms.ts                    # CMS provider switch
└── wordpress/
    ├── env.ts                # Zod validácia WP env
    ├── client.ts             # WooCommerce REST fetch
    ├── types.ts              # WooCommerce typy
    ├── adapter.ts            # Woo → Shopify-shaped types (pre UI migráciu)
    ├── products.ts           # Produktové queries
    └── categories.ts         # Kategórie / kolekcie
```

---

## Odporúčaný postup (ďalší krok)

1. Postaviť WordPress + WooCommerce na `cms.growmedica.cz` (DNS, SSL, mu-plugins)
2. Vygenerovať WooCommerce REST API keys (Read/Write)
3. Importovať kategórie a produkty (`yarn import:categories` + `yarn import:products`)
4. Nastaviť Vercel env: `WOO_MOCK_MODE=0`, live keys
5. Overiť live cart, ISR webhooks, `/dashboard` iframe
6. **Bez UI zmien** — pozri [TODO.md](../../TODO.md)