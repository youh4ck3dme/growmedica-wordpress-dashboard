# GrowMedica — monorepo (Claude Code)

**Prod:** https://www.growmedica.cz · **CMS:** https://cms.growmedica.cz  
**Owner profile:** `~/.claude/CLAUDE.md` (globálne pravidlá)

Tento repozitár = WordPress/WooCommerce CMS + Next.js storefront.

## Čítaj najprv

| Súbor | Prečo |
|-------|--------|
| [AGENTS.md](./AGENTS.md) | Hard rules pre agentov (UI freeze, mock env, commands) |
| [STATUS.md](./STATUS.md) | Čo je hotové / čo len majiteľ |
| [TODO.md](./TODO.md) | Otvorené tasky |
| [majitel.md](./majitel.md) | Ľudský checklist (SuperFaktúra, merchant) |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | Prevádzka, endpointy |
| [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md) | Packeta, Stripe, SF, GoPay, DPD |

## Layout

```
growmedica-wordpress-dashboard/
├── storefront/          # Next.js 15 app — SEM robíš FE/API prácu
│   ├── src/app/         # routes
│   ├── src/components/  # ⛔ UI FREEZE — neupravuj bez explicitného OK
│   ├── src/lib/         # ✅ business logic, Woo, i18n, dashboard agent
│   └── tests/           # Playwright integrity + e2e
├── wordpress/mu-plugins/
├── docs/ · reports/ · scripts/
└── AGENTS.md · STATUS.md · majitel.md
```

## Hard rules

1. **UI/UX FREEZE** — nemeniť `storefront/src/components/**`, layout JSX v `src/app/**`, design tokeny v `globals.css` bez explicitného povolenia.
2. **UPRAVUJ** hlavne: `storefront/src/lib/**`, `storefront/src/app/api/**`, `wordpress/mu-plugins/**`, testy, env skripty, i18n JSON.
3. Live CMS = **WordPress/Woo** (`CMS_PROVIDER=wordpress`). Shopify runtime v storefronte **nie je**.
4. Package manager: **Yarn 1** v `storefront/`. Node 22.
5. Nikdy necommituj merchant secrets / Woo keys / Mistral keys.

## Commands (vždy z `storefront/`)

```bash
cd storefront
yarn install
yarn setup:env          # alebo mock env z AGENTS.md
yarn dev                # http://localhost:5555
yarn type-check
yarn lint
yarn test:integrity
yarn test:woo:integrity
yarn diagnostic
yarn test:quick
yarn build
```

Mock env (lokál bez live Woo) — pozri [AGENTS.md](./AGENTS.md) sekciu *Local env*.

## Locale / market

- Primárny trh: **CZ** (www.growmedica.cz), predaj/ship aj SK/AT/HU/PL
- Mena: **EUR**
- i18n: SK / EN / DE v `storefront/src/lib/i18n/locales/`
- Dátumy v UI: lokálne formáty, nie US

## Cart / checkout

- Server cart: `/api/cart/add` + httpOnly cookie `growmedical_cart_id`
- Checkout seed: Woo `gm_cart` (mu-plugin / Code Snippet na CMS)
- Overenie košíka: add → full reload `/kosik`

## Dashboard agent

- `/dashboard` — hybrid/agentic mode (Mistral tools)
- Tools: `storefront/src/lib/dashboard-agent/`
- Docs: `storefront/docs/DASHBOARD_AGENT.md`, `DASHBOARD_PANELS.md`
- Test: `yarn test:dashboard-agent`

## Priority work

1. Merchant handoff (SuperFaktúra 2a–2j, Stripe, Packeta) — majiteľ keys, agent wiring
2. Dashboard agent tools expansion
3. ISR webhooks / revalidate
4. Catalog import scripts
5. **Bez UI redesignu**

## Claude MCP užitočné tu

- `github` — PRs, issues
- `fetch` — prod smoke / docs
- Claude.ai `Supabase` len ak projekt používa Supabase (storefront primárne Woo)
- Claude.ai `Vercel` — deploy env

## Git

- Branch z `main`, PR preferred
- Commit messages: konkrétne (`fix woo cart cookie on multi-SKU`)
