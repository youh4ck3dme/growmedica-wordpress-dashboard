# AGENTS.md

## Cursor Cloud specific instructions

### ⛔ UI/UX FREEZE (kritické)

Storefront UI sa **nikde nemení**. Pri každom tasku:

- **NEUPRAVUJ** `src/components/**`, layout JSX v `src/app/**`, design tokeny v `globals.css`
- **UPRAVUJ** len `src/lib/**`, `src/app/api/**`, `wordpress/mu-plugins/**`, testy, env skripty
- i18n: len `src/lib/i18n/locales/*.json` (preklady), nie komponenty
- Tailwind údržba: canonical triedy alebo presun do existujúcich CSS tried — bez zmeny vzhľadu

Referencia: [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) · [storefront/UI_UX_DESIGN_SYSTEM.md](./storefront/UI_UX_DESIGN_SYSTEM.md)

### Project layout

- Aplikácia je Next.js 15 / React 19 storefront v `storefront/` (GrowMedica, SK e-commerce).
- Package manager: **Yarn 1** (`storefront/yarn.lock`). Node 22. Všetky príkazy z `storefront/`.
- WordPress mu-plugins: `wordpress/mu-plugins/`
- Hlavný stav: [STATUS.md](./STATUS.md) · [TODO.md](./TODO.md)

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

### Ďalší vývoj (priorita)

1. Live = Woo na www (`CMS_PROVIDER=wordpress`). Zostáva: E2E nákup, Stripe/GoPay, Packeta/DPD API, sklad. Detail: [STATUS.md](./STATUS.md)
2. Dashboard Agent tools — rozšírenie `src/lib/dashboard-agent/tools.ts`
3. ISR webhooks — `wordpress/mu-plugins/growmedica-revalidate.php`
4. Import katalógu — `yarn import:categories` + `yarn import:products`

**Bez UI zmien.** Pozri [../TODO.md](../TODO.md).
