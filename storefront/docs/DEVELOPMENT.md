# GrowMedica — Development Guide

**Aktualizované:** 14. júl 2026  
**Doména:** https://growmedica.cz  
**CMS:** https://cms.growmedica.cz

---

## ⛔ UI/UX FREEZE

Storefront UI je **uzamknutý**. Ďalší vývoj je len backend, integrácia, dashboard logika a testy.

### Čo sa NESMIE meniť

- Layout stránok (`src/app/**/page.tsx` — len dátová logika, nie JSX štruktúra)
- Komponenty (`src/components/**`) — žiadne redesigny
- `src/styles/globals.css` — design tokeny, farby, spacing, animácie
- Header, footer, mega menu, hero, product cards, cart drawer
- Breakpointy, gridy, hover stavy, shadow, border-radius

### Čo sa MÔŽE meniť

| Oblasť | Súbory |
|--------|--------|
| WordPress/Woo client | `src/lib/wordpress/*` |
| Unified catalog | `src/lib/catalog/*` |
| Dashboard Agent | `src/lib/dashboard-agent/*`, `src/app/api/dashboard/*` |
| Cart BFF | `src/app/api/cart/*` |
| AI backend | `src/lib/ai/*`, `src/app/api/ai/*` |
| i18n preklady | `src/lib/i18n/locales/*.json` |
| Env / deploy skripty | `scripts/*`, `.env.example` |
| WP mu-plugins | `wordpress/mu-plugins/*` |
| Testy | `tests/**` |

### Výnimky (vyžadujú explicitné schválenie)

- Kritický bugfix, ktorý vizuálne ovplyvní UI
- Prístupnosť (a11y) — len minimálny fix bez redesignu
- Právne texty (GDPR, obchodné podmienky) — obsah, nie layout

Design referencia: [UI_UX_DESIGN_SYSTEM.md](../UI_UX_DESIGN_SYSTEM.md)

---

## Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│  growmedica.cz (Vercel — Next.js 15 storefront)             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Verejný web │  │ /dashboard   │  │ /api/* BFF          │ │
│  │ produkty,   │  │ AI Agent +   │  │ cart, search,       │ │
│  │ košík, AI   │  │ WP iframe    │  │ revalidate, agent   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │           │
│         └────────────────┼──────────────────────┘           │
│                          │ catalog/* (CMS_PROVIDER)         │
└──────────────────────────┼──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │ cms.growmedica.cz       │
              │ WordPress + WooCommerce │
              │ REST API + mu-plugins   │
              └─────────────────────────┘
```

| Vrstva | Technológia | Úloha |
|--------|-------------|-------|
| Storefront | Next.js 15, React 19, Tailwind 4 | Presentation (UI frozen) |
| CMS | WordPress 6.7 + WooCommerce | Produkty, kategórie, objednávky |
| AI | Mistral | Farmaceutický asistent + Dashboard Agent |
| PWA | Serwist | Offline, install |
| i18n | Cookie + geo + middleware | CS / SK / EN / DE (URL slugy fixné) |
| Legacy | Shopify (`CMS_PROVIDER=shopify`) | Rollback fallback |

---

## Lokálny štart

```bash
cd growmedica-wordpress-dashboard/storefront
yarn install
cp .env.example .env.local   # alebo yarn setup:env
yarn dev                     # http://localhost:5555
```

### Mock režim (bez credentials)

```env
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
MISTRAL_MOCK_MODE=1
SHOPIFY_MOCK_MODE=1
DASHBOARD_AGENT_SECRET=local-dashboard-agent-secret-min-16-chars
NEXT_PUBLIC_DASHBOARD_MODE=hybrid
NEXT_PUBLIC_SITE_URL=http://localhost:5555
```

### WordPress lokálne (Docker)

```bash
cd growmedica-wordpress-dashboard
docker compose up -d
# WP: http://localhost:8080/wp-admin
```

V `.env.local`:

```env
WORDPRESS_BASE_URL=http://localhost:8080
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:8080/wp-admin
```

Pozri [WORDPRESS_SETUP.md](../../WORDPRESS_SETUP.md).

---

## Kľúčové routes (storefront)

| Route | Typ | Poznámka |
|-------|-----|----------|
| `/` | Verejná | Homepage — UI frozen |
| `/produkty`, `/produkty/[handle]` | Verejná | Katalóg z `catalog/*` |
| `/kolekcie`, `/kolekcie/[handle]` | Verejná | Kategórie |
| `/kosik` | Verejná | Woo cart BFF |
| `/dashboard` | Admin | AI Agent + WP iframe, noindex |
| `/api/cart/*` | BFF | Server-side cart session |
| `/api/dashboard/*` | BFF | Mistral Agent tools |
| `/api/revalidate` | Webhook | ISR z WP mu-plugin |

---

## CMS prepínač

`CMS_PROVIDER` v `src/lib/cms.ts`:

- `wordpress` — produkcia (WooCommerce REST)
- `shopify` — legacy rollback

Všetky stránky používajú `src/lib/catalog/*` — nikdy priamo `shopify/` ani `wordpress/` v komponentoch.

---

## Testy

```bash
cd storefront

yarn type-check              # TypeScript
yarn test:integrity          # Shopify mock (~137+ testov)
yarn test:woo:integrity      # WordPress mock
yarn test:i18n               # SK/EN/DE
yarn test:dashboard-agent    # Mistral Agent mock
yarn build                   # Production build
yarn diagnostic              # Rýchla health check
yarn production:smoke        # HTTP smoke (PREVIEW_URL=...)
```

---

## Deploy

| Služba | Platforma | URL |
|--------|-----------|-----|
| Storefront | Vercel | https://growmedica.cz |
| WordPress CMS | vlastný hosting | https://cms.growmedica.cz |

Checklist: [PRODUCTION_CHECKLIST.md](../../PRODUCTION_CHECKLIST.md)  
Dashboard: [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)  
Vercel env skript: `yarn vercel:wordpress-env`

---

## Dokumentácia — index

| Dokument | Obsah |
|----------|-------|
| [README.md](../../README.md) | Prehľad projektu |
| [TODO.md](../../../TODO.md) | Aktuálne úlohy |
| [UI_UX_DESIGN_SYSTEM.md](../UI_UX_DESIGN_SYSTEM.md) | Design tokens (frozen) |
| [I18N.md](./I18N.md) | Lokalizácia SK/EN/DE |
| [WOO_CART.md](./WOO_CART.md) | Košík BFF |
| [DASHBOARD_AGENT.md](./DASHBOARD_AGENT.md) | Mistral Command Bar |
| [WP_WEBHOOKS.md](./WP_WEBHOOKS.md) | ISR revalidácia |
| [DIAGNOSTICS.md](./DIAGNOSTICS.md) | Health checks |
| [WORDPRESS_SETUP.md](../../WORDPRESS_SETUP.md) | Lokálny WP |
| [AGENTS.md](../../AGENTS.md) | Cursor / AI agent pravidlá |

---

## Pravidlá pre AI agenty (Cursor)

1. **Nikdy nemeň UI** — ak task hovorí „oprav integráciu“, nedotýkaj sa `components/` ani `globals.css` design tokenov.
2. Všetky `yarn` príkazy spúšťaj z `storefront/`.
3. Nové featury idú cez `catalog/*` alebo `api/*`, nie priamo do page komponentov.
4. Mock režim je default pre dev — `WOO_MOCK_MODE=1`, `MISTRAL_MOCK_MODE=1`.
5. Pred PR: `yarn type-check` + relevantné Playwright testy.
6. Tailwind údržba: canonical triedy alebo presun do existujúcich CSS tried — **bez zmeny vzhľadu**.
