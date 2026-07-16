# GrowMedica — Next.js + WooCommerce

Headless e-shop: **Next.js 15** (Vercel) + **WordPress/WooCommerce** CMS.

| | URL |
|--|-----|
| E-shop | https://www.growmedica.cz |
| CMS admin | https://cms.growmedica.cz/wp-admin |

> **⛔ UI/UX FREEZE** — nemeniť layout/dizajn storefrontu bez zadania.  
> **Stav a úlohy:** **[STATUS.md](./STATUS.md)** · [TODO.md](./TODO.md)

## Stav (skrátka)

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
NEXT_PUBLIC_SITE_URL=https://www.growmedica.cz
```

Secrets **nikdy do gitu** — len `.env.local` / `wordpress-production.local.env`.

### Shopify (legacy rollback)

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
├── reports/                  # aktuálne reporty
│   └── archive/              # historické plány
├── storefront/               # Next.js app
│   ├── src/lib/catalog/      # unified CMS
│   ├── src/lib/wordpress/    # Woo client + cart
│   └── src/lib/shopify/      # rollback / import
├── wordpress/mu-plugins/     # CORS + revalidate (zdroj)
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

## Zakázané

- Secrets v gite  
- `DB_*` na Vercel  
- UI redesign bez zadania  
