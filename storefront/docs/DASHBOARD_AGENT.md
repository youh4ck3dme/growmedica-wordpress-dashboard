# Dashboard Agent (Mistral Command Bar)

Natívny AI admin modul v Next.js storefronte na `/dashboard`. Mistral orchestruje tool-calling akcie nad **WooCommerce** (katalóg, objednávky, sklad) s audit logom a exportom CSV.

**Stav (2026-07-19):** všetky agent tools idú cez Woo REST — žiadny Shopify Admin stub. Odkaz „WordPress admin“ v UI → `https://cms.growmedica.cz/wp-admin`.

## Režimy (`NEXT_PUBLIC_DASHBOARD_MODE`)

| Režim | Správanie |
|-------|-----------|
| `agentic` | Natívny admin + AI Agent (default na produkcii) |
| `iframe` | Externý admin iframe (legacy; default URL = WP admin) |
| `hybrid` | Tabs: AI Agent + iframe (legacy) |

Default: `agentic`.

Pozri [DASHBOARD_PANELS.md](./DASHBOARD_PANELS.md) pre natívne panely (produkty, objednávky, sklad).

## Env premenné

| Premenná | Príklad | Účel |
|---|---|---|
| `NEXT_PUBLIC_DASHBOARD_MODE` | `agentic` | Režim dashboardu |
| `DASHBOARD_AGENT_SECRET` | `min-32-chars-secret` | Auth pre `/api/dashboard/*` + secret gate |
| `DASHBOARD_ALLOW_LIVE_WRITES` | `1` | Povoliť live zápisy do Woo (sklad, copy, SEO, ceny) |
| `MISTRAL_API_KEY` | `...` | Live Mistral (alebo `MISTRAL_MOCK_MODE=1`) |
| `CMS_PROVIDER` | `wordpress` | Katalóg backend (vždy wordpress) |
| `WORDPRESS_BASE_URL` + `WOO_CONSUMER_KEY` + `WOO_CONSUMER_SECRET` | cms + ck/cs | Live Woo REST |
| `WOO_MOCK_MODE` | `1` | Mock katalóg pre dev/test |
| `UPSTASH_REDIS_REST_URL` | `...` | Voliteľná persistencia audit logu |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | Upstash token |

## API auth

Dashboard API akceptuje:

1. **HttpOnly session cookie** (preferované v prehliadači) — vytvorí sa cez `POST /api/dashboard/session`
2. **Header** (testy, curl, smoke skripty):

```
x-dashboard-agent-secret: <DASHBOARD_AGENT_SECRET>
```

### `POST /api/dashboard/session`

Vydá httpOnly cookie `growmedica-dashboard-agent-session` (24h). Volá sa automaticky pri načítaní `/dashboard`.

### `POST /api/dashboard/agent`

```json
{
  "command": "Zobraz produkty",
  "conversation_id": "optional-uuid",
  "mode": "assist"
}
```

| `mode` | Správanie |
|--------|-----------|
| `assist` (default) | Interaktívny agent. Live zápis len s `confirm` + `DASHBOARD_ALLOW_LIVE_WRITES=1`. |
| `plan` | Plánovanie + dry-run. Write tools majú server-side `confirm=false` (simulácia). |
| `monitor` | Read-only. Write tools sa odfiltrujú (prompt + server). |

`mode` mení system prompt a server-side constraints. **Neobchádza** write gate (`confirm` + `DASHBOARD_ALLOW_LIVE_WRITES`).

Odpoveď:

```json
{
  "conversation_id": "conv-...",
  "reply": "✅ Nájdených 10 produktov...",
  "actions": [{ "tool": "list_products", "args": {}, "result": {}, "status": "ok" }],
  "mode": "assist"
}
```

### `GET /api/dashboard/audit?limit=50&offset=0`

Vráti posledné audit záznamy (tool, stav, timestamp, IP hash args).

### `GET /api/dashboard/export/[id]`

Stiahnutie CSV exportu vygenerovaného nástrojom `export_catalog_csv`.

## Nástroje (Mistral tools)

| Tool | Popis |
|------|-------|
| `list_products` | Zoznam produktov (search, limit) |
| `get_product` | Detail podľa slug/handle |
| `list_collections` | Zoznam kategórií/kolekcií |
| `get_collection_products` | Produkty v kategórii podľa handle |
| `catalog_summary` | Agregovaný prehľad katalógu |
| `optimize_product_copy` | AI návrh title/short_description (SK, compliance + dĺžka) |
| `generate_product_seo` | Meta title + description pre SEO |
| `bulk_update_prices` | Hromadná zmena cien (`confirm: true` pre zápis) |
| `export_catalog_csv` | Export CSV + download link |
| `get_integration_status` | CMS + Mistral + mock/live stav |
| `apply_product_copy` | Zapíše optimalizovaný copy do WooCommerce (`confirm: true`) |
| `apply_product_seo` | Zapíše SEO meta (Rank Math / Yoast) do Woo produktu (`confirm: true`) |
| `update_inventory` | Zmena skladu podľa handle (`confirm: true`) |
| `list_orders` | Posledné WooCommerce objednávky |
| `get_order` | Detail WooCommerce objednávky |

Agent používa **Mistral tool-calling** s regex fallbackom pri chybe API.

**Bezpečnosť zápisu:** deštruktívne tools sú default dry-run. Live zápis vyžaduje `confirm: true` + `DASHBOARD_ALLOW_LIVE_WRITES=1`.

## Príklady príkazov

- „Zobraz produkty“
- „Zoznam kategórií“
- „Súhrn katalógu“
- „Export CSV katalógu“
- „Stav integrácie“
- „Hromadná zmena cien o 5%“
- „Zobraz posledných 10 objednávok“
- „Optimalizuj copy produktu omega-3“
- „SEO pre produkt reishi-extrakt“
- „Produkt {slug} nastav sklad 12“ (dry-run; live s potvrdením + `DASHBOARD_ALLOW_LIVE_WRITES=1`)

## E4 — Kvalita SK copy (`optimize_product_copy`)

Tool generuje `title` + `short_description` po slovensky s GrowMedica tónom. Výstup prechádza:

- **Compliance** — rovnaké zakázané vzory ako `checkCompliance` (liečba, vyliečenie, …)
- **Dĺžka** — title 10–80 znakov, short_description 40–220 znakov
- **Retry** — pri live Mistral jeden opakovaný pokus s feedbackom

Súbory: `src/lib/dashboard-agent/copyQuality.ts`, `prompts/optimize-product-copy.ts`

### Manuálny live test

```bash
MISTRAL_MOCK_MODE=0 MISTRAL_API_KEY=... yarn dev
curl -s -X POST http://localhost:5555/api/dashboard/agent \
  -H "Content-Type: application/json" \
  -H "x-dashboard-agent-secret: local-dashboard-agent-secret-min-16-chars" \
  -d '{"command":"Optimalizuj copy produktu proteiny-mock-1"}' | jq '.actions[] | select(.tool=="optimize_product_copy")'
```

### Automatické testy

```bash
yarn test:dashboard-agent          # mock — optimize_product_copy
npx playwright test tests/integrity/copy-quality.spec.ts
MISTRAL_API_KEY=... MISTRAL_MOCK_MODE=0 yarn playwright test tests/integrity/dashboard-agent-live.spec.ts
MISTRAL_API_KEY=... node scripts/mistral-agent-live-smoke.mjs
```

## Lokálny štart

```bash
cd storefront
# .env.local
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
MISTRAL_MOCK_MODE=1
NEXT_PUBLIC_DASHBOARD_MODE=hybrid
DASHBOARD_AGENT_SECRET=local-dashboard-agent-secret-min-16-chars
NEXT_PUBLIC_DASHBOARD_URL=https://growmedica-nexus.lovable.app/admin

yarn dev
# → http://localhost:5555/dashboard
```

## Live Mistral smoke

```bash
MISTRAL_MOCK_MODE=0 MISTRAL_API_KEY=... node scripts/mistral-agent-live-smoke.mjs
# alebo
MISTRAL_API_KEY=... yarn playwright test tests/integrity/dashboard-agent-live.spec.ts
```

## Testy

```bash
yarn test:dashboard-agent
```

## Súbory

| Súbor | Účel |
|---|---|
| `src/lib/dashboard-agent/` | Orchestrator, tools, memory, audit, session |
| `src/app/api/dashboard/` | Agent, audit, export, session API |
| `src/components/dashboard/agent/` | UI Command Bar a panely |
| `src/lib/dashboard.ts` | `getDashboardMode()`, `getDashboardUrl()` |
