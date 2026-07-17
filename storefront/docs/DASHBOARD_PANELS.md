# Dashboard Panels (native admin)

Natívny admin modul na `/dashboard` v Next.js storefronte — bez Nexus iframe.

## Navigácia

| Panel | Cesta | API |
|-------|-------|-----|
| Prehľad | Home | `GET /api/dashboard/overview` |
| Produkty | Products | `GET /api/dashboard/products` |
| Detail produktu | Product detail | `GET/PUT /api/dashboard/products/[handle]` |
| Objednávky | Orders | `GET /api/dashboard/orders` |
| Sklad | Inventory | `GET/PUT /api/dashboard/inventory` |
| AI Agent | Agent | `POST /api/dashboard/agent` |
| Audit log | Audit | `GET /api/dashboard/audit` |

## Auth

1. Otvorte `https://www.growmedica.cz/dashboard`
2. Zadajte `DASHBOARD_AGENT_SECRET` na secret gate obrazovke
3. Session cookie platí 24h

Alternatíva (testy, curl):

```
x-dashboard-agent-secret: <DASHBOARD_AGENT_SECRET>
```

Read-only health check bez auth: `GET /api/dashboard/health`

## Prepojenie s growmedica.cz

- Každý produkt má link **Zobraziť na webe** → `/produkty/{handle}`
- Po `PUT` produktu sa volá `revalidateTag('product-{handle}')` — zmeny na webe do ~60s
- Katalóg číta rovnaký `catalog/*` facade ako verejný e-shop

## Shopify Admin writes

Vyžaduje server env:

```
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
DASHBOARD_ALLOW_LIVE_WRITES=1
```

Zápisy sú chránené `confirm: true` v API a agent tools.

## Súbory

```
src/components/dashboard/
  SecretGate.tsx
  layout/DashboardLayout.tsx
  panels/HomePanel.tsx
  panels/ProductsPanel.tsx
  panels/ProductDetailPanel.tsx
  panels/OrdersPanel.tsx
  panels/InventoryPanel.tsx
  agent/DashboardShell.tsx
  agent/AgentActionResults.tsx

src/lib/shopify/admin/     # Admin API client
src/app/api/dashboard/     # BFF routes
```

## Env (produkcia)

| Premenná | Hodnota |
|----------|---------|
| `NEXT_PUBLIC_DASHBOARD_MODE` | `agentic` |
| `DASHBOARD_AGENT_SECRET` | min. 32 znakov |
| `DASHBOARD_ALLOW_LIVE_WRITES` | `1` |
| `SHOPIFY_CLIENT_ID` + `SECRET` | server-only |
| `UPSTASH_REDIS_REST_*` | audit + conversation memory |

Pozri tiež: [DASHBOARD_AGENT.md](./DASHBOARD_AGENT.md) · [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)
