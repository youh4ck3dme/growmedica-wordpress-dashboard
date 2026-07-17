# GrowMedica — Next.js + WooCommerce

Headless e-shop: **Next.js 15** (Vercel) + **WordPress/WooCommerce** CMS.

| | URL |
|--|-----|
| E-shop | https://www.growmedica.cz |
| CMS admin | https://cms.growmedica.cz/wp-admin |

> **⛔ UI/UX FREEZE** — nemeniť layout/dizajn storefrontu bez zadania.  
> **Stav a úlohy:** **[STATUS.md](./STATUS.md)** · [TODO.md](./TODO.md)

## Stav (skrátka)

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
| SEO taxonomy + redirects | ✅ `/kategorie`, freeze 1.1.0 |
| Shopify integrácia | 🟡 Legacy rollback (`CMS_PROVIDER=shopify`) |

| | |
|--|--|
| Katalóg | ✅ Woo (`CMS_PROVIDER=wordpress`) |
| Košík | ✅ cookie BFF → cms checkout |
| Platby | ✅ BACS + COD · ⬜ Stripe/GoPay |
| Doprava SK | ✅ flat rates · ⬜ Packeta/DPD map API |
| Firma / e-maily | ✅ [docs/vzorfirma.md](./docs/vzorfirma.md) |

## Quick start

```bash
cd storefront
yarn install
cp .env.example .env.local   # mock hodnoty stačia na dev
yarn dev                     # http://localhost:5555
```

### Produkčný WordPress režim (env)

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin
NEXT_PUBLIC_SITE_URL=https://www.growmedica.cz
NEXT_PUBLIC_DEFAULT_LOCALE=cs
```

Secrets **nikdy do gitu** — len `.env.local` / `wordpress-production.local.env`.

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
# + Storefront token alebo TOKENLESS=1
```

## Testy a smoke

```bash
cd storefront
yarn type-check
yarn diagnostic
yarn test:woo:integrity      # Woo mock integrity
yarn test:e2e:live           # produkčný nákup www → cms
yarn production:smoke        # PREVIEW_URL=https://www.growmedica.cz
```

Testy: `storefront/tests/` · [tests/README.md](./storefront/tests/README.md) · prompt: [docs/PROMPT_TESTS.md](./docs/PROMPT_TESTS.md)

## Štruktúra

```
growmedica-wordpress-dashboard/
├── STATUS.md                 # ← čo je live a čo robiť
├── TODO.md
├── PRODUCTION_CHECKLIST.md
├── docs/vzorfirma.md         # firma / banka
├── reports/                  # aktuálne reporty (+ seo-taxonomy/)
│   └── archive/              # historické plány
├── storefront/               # Next.js app
│   ├── src/lib/catalog/      # unified CMS
│   ├── src/lib/wordpress/    # Woo client + cart
│   └── src/lib/shopify/      # rollback / import
├── wordpress/mu-plugins/     # CORS + revalidate + checkout seed
└── scripts/                  # CMS setup
```

## Dokumentácia

| Dokument | |
|----------|--|
| [STATUS.md](./STATUS.md) | **Hlavný stav + backlog** |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | **Endpointy, env, prevádzka** |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Deploy / env / smoke |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | IČO, DIČ, IBAN |
| [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) | Vývoj + freeze |
| [storefront/docs/WOO_CART.md](./storefront/docs/WOO_CART.md) | Košík |
| [storefront/docs/I18N.md](./storefront/docs/I18N.md) | CS/SK/EN/DE |
| [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md) | Lokálny WP |
| [AGENTS.md](./AGENTS.md) | Pravidlá pre AI |
| [reports/seo-taxonomy/FINAL_STATUS.md](./reports/seo-taxonomy/FINAL_STATUS.md) | SEO taxonomy status |

## Zakázané

- Secrets v gite  
- `DB_*` na Vercel  
- UI redesign bez zadania  
