# WORDPRESS IMPLEMENTATION PLAN — GrowMedica Headless Storefront + Dashboard

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

### Fáza 0 — Scaffold (hotové v tomto repozitári)

- [x] Fork z `growmedica-nextjs-storefront`
- [x] `src/lib/wordpress/` — WooCommerce client, adapter, produkty, kategórie
- [x] `src/lib/cms.ts` — prepínač `CMS_PROVIDER`
- [ ] Env validácia v `env.ts` (voliteľný WordPress režim)
- [ ] Route handlers: `/api/revalidate` pre WP webhooks

### Fáza 1 — Katalóg (produkty + kategórie)

- [ ] Nastaviť `WORDPRESS_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`
- [ ] `CMS_PROVIDER=wordpress` na preview prostredí
- [ ] Mapovanie 14 kategórií GrowMedica → WooCommerce product categories
- [ ] Import produktov zo Shopify exportu / legacy PHP
- [ ] Playwright testy s WooCommerce mock/fixture

### Fáza 2 — Košík a checkout

- [ ] WooCommerce Store API alebo custom BFF pre cart session
- [ ] Nahradenie Shopify cart mutations
- [ ] Checkout redirect na WooCommerce checkout URL
- [ ] Order webhooks → revalidácia ISR

### Fáza 3 — Dashboard

- [ ] `/dashboard` iframe → WordPress admin (`/wp-admin`) alebo custom plugin UI
- [ ] Auth: WP Application Passwords / JWT plugin
- [ ] CSP `frame-ancestors` na WP hostingu
- [ ] Deprecate growmedica-nexus (Supabase/Firebase admin)

### Fáza 4 — Cutover

- [ ] Production `CMS_PROVIDER=wordpress`
- [ ] Odstránenie Shopify env premenných
- [ ] DNS: `growmedica.sk` → Next.js, `cms.growmedica.sk` → WordPress

---

## Env premenné

```bash
# CMS provider: shopify | wordpress (auto-detect ak chýba)
CMS_PROVIDER=wordpress

# WordPress / WooCommerce (server-only)
WORDPRESS_BASE_URL=https://cms.growmedica.sk
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=your-random-webhook-secret-min-16-chars

# Dashboard iframe (WordPress admin alebo custom plugin route)
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.sk/wp-admin

# Zachované zo storefrontu
NEXT_PUBLIC_SITE_URL=https://growmedica.sk
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

1. Postaviť WordPress + WooCommerce na `cms.growmedica.sk`
2. Vygenerovať WooCommerce REST API keys (Read/Write)
3. Importovať kategórie a produkty
4. Nastaviť `CMS_PROVIDER=wordpress` na Vercel preview
5. Postupne prepínať stránky z `lib/shopify/*` na `lib/wordpress/*`