# WordPress/WooCommerce Migration Plan

## Kontext

Tento repozitár vznikol z **`growmedica-nextjs-storefront`** (najnovší, najčistejší GrowMedica projekt) s cieľom nahradiť Shopify za WordPress/WooCommerce CMS.

## Zdrojové projekty

| Projekt | Stav | Úloha pri migrácii |
|---|---|---|
| `growmedica-nextjs-storefront` | Aktívny (júl 2026) | **Základ** — UI, PWA, AI, testy |
| `growmedica` | Komplexný, rozbité configy | Referencia pre Supabase/Stripe logiku |
| `growmedica-next-storefront` | Starší Vite→Next migration | Nepoužívať |
| `growmedica-ai-agent` | PHP PoC | Referencia pre WP backend patterns |
| `growmedica-eshop` | PHP základ | Legacy dáta |

## Architektúra (cieľová)

```
┌─────────────────────┐     REST API      ┌──────────────────────────┐
│  Next.js Storefront │ ◄───────────────► │ WordPress + WooCommerce  │
│  (Vercel)           │   /wp-json/wc/v3  │ (cms.growmedica.cz)      │
│  - PWA              │                   │ - Produkty, sklad        │
│  - Mistral AI       │                   │ - Objednávky             │
│  - /dashboard iframe│ ──iframe────────► │ - /wp-admin dashboard    │
└─────────────────────┘                   └──────────────────────────┘
```

## Mapovanie Shopify → WooCommerce

| Shopify | WooCommerce |
|---|---|
| Product `handle` | Product `slug` |
| Collection | Product Category |
| Storefront API GraphQL | REST API v3 |
| Cart mutations | Store API / custom session |
| `SHOPIFY_REVALIDATION_SECRET` | `WORDPRESS_REVALIDATION_SECRET` |
| growmedica-nexus admin | WordPress admin / custom plugin |

## Riziká

1. **Cart session** — WooCommerce nemá ekvivalent Shopify Storefront cart; treba BFF alebo Store API
2. **Checkout** — headless checkout je zložitejší než Shopify redirect
3. **Auth v iframe** — WP cookies v third-party iframe (rovnaký problém ako Nexus)
4. **Performance** — REST API vs GraphQL; zvážiť WPGraphQL vo fáze 2

## Referencie

- `storefront/WORDPRESS_IMPLEMENTATION_PLAN.md` — implementačný plán
- `storefront/src/lib/wordpress/` — WooCommerce integračná vrstva
- `it-Next.js-WooCommerce` (lokálny referenčný projekt) — BFF patterns