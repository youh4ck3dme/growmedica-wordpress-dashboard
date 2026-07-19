# Dashboard Panels (native admin)

Natívny admin modul na `/dashboard` v Next.js storefronte — **WooCommerce** backend.

**Aktualizované:** 2026-07-19 — panely aj AI agent tools sú Woo-only (Shopify Admin stuby odstránené). Odkaz v sidebar → WordPress admin.

## Navigácia

| Panel | API | Stav |
|-------|-----|------|
| Prehľad | `GET /api/dashboard/overview` | Woo katalóg + recent orders |
| Produkty | `GET /api/dashboard/products` | Woo read-only list |
| Detail produktu | `GET /api/dashboard/products/[handle]` | Woo read-only |
| Objednávky | `GET /api/dashboard/orders` | Woo orders |
| Sklad | `GET/PUT /api/dashboard/inventory` | Woo stock; PUT len s `DASHBOARD_ALLOW_LIVE_WRITES=1` |
| AI Agent | `POST /api/dashboard/agent` | Mistral + Woo tools (`list_orders`, inventory, apply copy/SEO, …) |
| Audit log | `GET /api/dashboard/audit` | Redis/memory |

Plná editácia (media, zložitejšie nastavenia): [cms.growmedica.cz/wp-admin](https://cms.growmedica.cz/wp-admin)

## Auth

1. Otvorte `https://www.growmedica.cz/dashboard`
2. Zadajte `DASHBOARD_AGENT_SECRET` (secret gate)
3. Session cookie 24h

```
x-dashboard-agent-secret: <DASHBOARD_AGENT_SECRET>
```

Health (public): `GET /api/dashboard/health` → `{ ok: true }`

## Env (produkcia Vercel)

| Premenná | Účel |
|----------|------|
| `DASHBOARD_AGENT_SECRET` | min. 16 znakov — **povinné** pre login |
| `NEXT_PUBLIC_DASHBOARD_MODE` | `agentic` (default) |
| `WORDPRESS_BASE_URL` + `WOO_CONSUMER_KEY` + `WOO_CONSUMER_SECRET` | katalóg, orders, inventory |
| `DASHBOARD_ALLOW_LIVE_WRITES` | `1` = povoliť zápis skladu + agent write tools |
| `MISTRAL_API_KEY` | AI agent |
| `UPSTASH_REDIS_REST_*` | audit + conversation (voliteľné) |

## Súbory

```
src/app/dashboard/              # UI route
src/app/api/dashboard/          # BFF
src/components/dashboard/       # panels + agent shell
src/lib/dashboard-agent/        # auth, orchestrator, tools
```

Pozri: [DASHBOARD_AGENT.md](./DASHBOARD_AGENT.md) · [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)
