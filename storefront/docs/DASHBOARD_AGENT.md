# Dashboard Agent (Mistral Command Bar)

Natívny AI admin modul v Next.js storefronte na `/dashboard`. Mistral orchestruje tool-calling akcie nad katalógom (`catalog/*`) s audit logom a exportom CSV.

## Režimy (`NEXT_PUBLIC_DASHBOARD_MODE`)

| Režim | Správanie |
|-------|-----------|
| `agentic` | Len Command Bar + AI panely |
| `iframe` | Len WordPress admin iframe (legacy) |
| `hybrid` | Tabs: **AI Agent** (default) + **WordPress admin** |

## Env premenné

| Premenná | Príklad | Účel |
|---|---|---|
| `NEXT_PUBLIC_DASHBOARD_MODE` | `hybrid` | Režim dashboardu |
| `DASHBOARD_AGENT_SECRET` | `local-dashboard-agent-secret-min-16-chars` | Auth pre `/api/dashboard/*` (min. 16 znakov) |
| `MISTRAL_API_KEY` | `...` | Live Mistral (alebo `MISTRAL_MOCK_MODE=1`) |
| `CMS_PROVIDER` | `wordpress` | Katalóg backend |
| `WOO_MOCK_MODE` | `1` | Mock katalóg pre dev/test |

## API

Všetky routes vyžadujú header:

```
x-dashboard-agent-secret: <DASHBOARD_AGENT_SECRET>
```

### `POST /api/dashboard/agent`

```json
{
  "command": "Zobraz produkty",
  "conversation_id": "optional-uuid"
}
```

Odpoveď:

```json
{
  "conversation_id": "conv-...",
  "reply": "✅ Nájdených 10 produktov...",
  "actions": [{ "tool": "list_products", "args": {}, "result": {}, "status": "ok" }]
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
| `optimize_product_copy` | AI návrh title/short_description |
| `bulk_update_prices` | Hromadná zmena cien (`confirm: true` pre zápis) |
| `export_catalog_csv` | Export CSV + download link |
| `get_integration_status` | CMS + Mistral + mock/live stav |

**Bezpečnosť zápisu:** `bulk_update_prices` je default dry-run. V mock režime (`WOO_MOCK_MODE` / `SHOPIFY_MOCK_MODE` / `MISTRAL_MOCK_MODE`) sa nikdy nezapisuje do live katalógu.

## Príklady príkazov

- „Zobraz produkty“
- „Export CSV katalógu“
- „Stav integrácie“
- „Hromadná zmena cien o 5%“
- „Optimalizuj copy produktu omega-3“

## Lokálny štart

```bash
cd storefront
# .env.local
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
MISTRAL_MOCK_MODE=1
NEXT_PUBLIC_DASHBOARD_MODE=hybrid
DASHBOARD_AGENT_SECRET=local-dashboard-agent-secret-min-16-chars
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:8080/wp-admin

yarn dev
# → http://localhost:5555/dashboard
```

## Testy

```bash
yarn test:dashboard-agent
```

## Súbory

| Súbor | Účel |
|---|---|
| `src/lib/dashboard-agent/` | Orchestrator, tools, memory, audit |
| `src/app/api/dashboard/` | Agent, audit, export API |
| `src/components/dashboard/agent/` | UI Command Bar a panely |
| `src/lib/dashboard.ts` | `getDashboardMode()`, `getDashboardUrl()` |
