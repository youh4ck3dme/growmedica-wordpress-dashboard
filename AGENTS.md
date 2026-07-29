# AGENTS.md

## Cursor Cloud specific instructions

### 0) Pred každou úlohou — backlog

1. Prečítaj **[README.md § AI AGENT](./README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29)** (kanónický backlog).  
2. Potom [STATUS.md](./STATUS.md) · [TODO.md](./TODO.md) · [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md).  
3. Po dokončení úlohy **aktualizuj** README AI sekciu + STATUS + TODO (zaškrtni hotové).

**Aktuálne P0:** reálna auth (`/prihlasenie`, `/profil`) · analytics (GTM/GA4) + consent.

### ⛔ UI/UX FREEZE (kritické)

Storefront UI sa **nikde nemení**. Pri každom tasku:

- **NEUPRAVUJ** `src/components/**`, layout JSX v `src/app/**`, design tokeny v `globals.css` bez explicitného schválenia
- **UPRAVUJ** len `src/lib/**`, `src/app/api/**`, `wordpress/mu-plugins/**`, testy, env skripty, docs
- i18n: len `src/lib/i18n/locales/*.json` (preklady), nie komponenty
- Tailwind údržba: canonical triedy alebo presun do existujúcich CSS tried — bez zmeny vzhľadu
- **Výnimka (schválená):** P0 auth/analytics/meta môže vyžadovať JSX v `prihlasenie` / `profil` / layout scripts — minimal diff, žiadny redesign

Referencia: [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) · [storefront/UI_UX_DESIGN_SYSTEM.md](./storefront/UI_UX_DESIGN_SYSTEM.md)

### Project layout

- Aplikácia je Next.js 15 / React 19 storefront v `storefront/` (GrowMedica, SK e-commerce).
- Package manager: **Yarn 1** (`storefront/yarn.lock`). Node 22. Všetky príkazy z `storefront/`.
- WordPress mu-plugins: `wordpress/mu-plugins/` (CORS allowlist, ISR revalidate header-only, **checkout seed `gm_cart`**)
- Default `CMS_PROVIDER` = **wordpress** (live). Shopify runtime **odstránený**.
- Hlavný stav: [README.md](./README.md) (AI AGENT) · [STATUS.md](./STATUS.md) · [TODO.md](./TODO.md)

### Local env (required to run `yarn dev` / `yarn build`)

`src/lib/env.ts` validuje env pri importe. Pre lokálny vývoj používaj **mock režim**:

```
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
WOO_CONSUMER_KEY=ck_mock
WOO_CONSUMER_SECRET=cs_mock
WORDPRESS_BASE_URL=http://localhost:8080
WORDPRESS_REVALIDATION_SECRET=mock-revalidation-secret-123456
SHOPIFY_MOCK_MODE=1
SHOPIFY_STORE_DOMAIN=mock-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=mock-storefront-token
SHOPIFY_REVALIDATION_SECRET=mock-revalidation-secret-123456
SHOPIFY_API_VERSION=2026-07
NEXT_PUBLIC_SITE_URL=http://localhost:5555
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:8080/wp-admin
NEXT_PUBLIC_DASHBOARD_MODE=hybrid
DASHBOARD_AGENT_SECRET=local-dashboard-agent-secret-min-16-chars
MISTRAL_MOCK_MODE=1
MISTRAL_API_KEY=mock-mistral-api-key
MISTRAL_MODEL=mistral-large-latest
```

V mock režime `src/lib/wordpress/mock.ts` a `src/lib/shopify/mock.ts` servujú deterministické dáta — bez siete.

### Commands (run in `storefront/`)

- `yarn dev` — dev server na porte **5555** (Turbopack)
- `yarn lint` / `yarn type-check` — ESLint / `tsc --noEmit`
- `yarn build` — production build (funguje v mock režime)
- `yarn test:integrity` — Playwright Shopify mock (~137+ passed)
- `yarn test:woo:integrity` — Playwright WordPress mock
- `yarn test:dashboard-agent` — Mistral Agent mock
- `yarn test:i18n` — lokalizácia SK/EN/DE
- `yarn diagnostic` — rýchla health check

### Gotchas

- `yarn test:integrity` obsahuje `database-schema.spec.ts`, ktorý číta `../../../wpbox/schema/*.yaml`. Adresár `wpbox/` nie je v tomto repozitári — 3 CPT testy sa **preskočia** (nie fail). Očakávaj **137 passed, 0 failed**.
- Cart je server-side: `/api/cart/add` + httpOnly cookie `growmedical_cart_id`. Pre overenie košíka v prehliadači: pridaj položku → full reload `/kosik`.
- `/dashboard` nemá shop chrome (middleware `x-dashboard-route: 1`). Testy: `yarn test:dashboard-agent`.
- Playwright Chromium je dostupný; `yarn test:integrity` nepotrebuje extra browser install.

### Shopify Admin token (`shpat_`)

Ak user dá Admin token alebo chce Nexus/Shopify zápis:

1. Prečítaj [storefront/docs/poznamky-agent.md](./storefront/docs/poznamky-agent.md) a [poznamky-agent.json](./storefront/docs/poznamky-agent.json)
2. Spusti `cd storefront && yarn shopify:admin-onboard --token "$TOKEN" --json`
3. Pri `403_api_disabled` → human handoff na [Develop apps](https://admin.shopify.com/store/growmedica/settings/apps/development) (Install app)
4. Po úspechu pripomeň Nexus env na [growmedica-nexus.lovable.app/admin](https://growmedica-nexus.lovable.app/admin) — mimo tohto repa
5. Nikdy nedávaj `shpat_` do `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

### Merchant API (user handoff)

Keď user pýta Packeta, debetnú kartu (Stripe), SuperFaktúru, GoPay alebo DPD — čítaj a aktualizuj:

- **[docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)** — centrálny hub (kde získať / kam vložiť)
- SuperFaktúra detail: [docs/SUPERFAKTURA_SETUP.md](./docs/SUPERFAKTURA_SETUP.md)
- SuperFaktúra majiteľ (2a–2k): [majitel.md](./majitel.md#2-superfaktúra--automatické-faktúry)
- SuperFaktúra API pattern: [docs/reference/superfaktura-api-pattern.md](./docs/reference/superfaktura-api-pattern.md)
- Shopify Admin: [storefront/docs/poznamky-agent.md](./storefront/docs/poznamky-agent.md)

Nikdy necommituj merchant secrets.

### Ďalší vývoj (priorita)

1. **P0 storefront:** reálna auth + analytics — [README.md § AI AGENT](./README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29)
2. Majiteľ: E2E nákup, SuperFaktúra **2a–2j**, Stripe/GoPay, Packeta/DPD, sklad, GTM IDs — [STATUS.md](./STATUS.md) · [majitel.md](./majitel.md)
3. P1: meta titles, wishlist, dead CSS `.why-growmedica__*`
4. Dashboard Agent tools — `src/lib/dashboard-agent/tools.ts`
5. Bez redesignu UI. Pozri [TODO.md](./TODO.md).
