# GrowMedica storefront — Claude Code

Si v **Next.js 15** storefronte. Root monorepo docs: `../AGENTS.md`, `../STATUS.md`, `../CLAUDE.md`.

## Non-negotiables

- **UI FREEZE:** neupravuj `src/components/**` ani vizuál layoutov v `src/app/**` / `globals.css`
- Pracuj v `src/lib/**`, `src/app/api/**`, testoch, `scripts/`, i18n JSON
- Package manager: **yarn** (nie npm/pnpm)
- Port: **5555**

## Stack

- Next.js 15 + React 19 + TypeScript
- Serwist PWA (`@serwist/next`)
- WooCommerce REST (live) + mock mode
- Mistral pre dashboard agent
- Playwright integrity suite
- Deploy: Vercel → www.growmedica.cz

## Daily commands

```bash
yarn dev
yarn type-check && yarn lint
yarn test:integrity
yarn test:woo:integrity
yarn diagnostic
yarn build
```

## Key paths

| Path | Role |
|------|------|
| `src/lib/wordpress/` | Woo client + mock |
| `src/lib/i18n/` | locales SK/EN/DE |
| `src/lib/dashboard-agent/` | agent tools |
| `src/app/api/` | cart, products, revalidate, AI |
| `src/middleware.ts` | i18n + dashboard route flags |
| `tests/integrity/` | contract tests |
| `UI_UX_DESIGN_SYSTEM.md` | design reference (read-only unless UI unfreeze) |
| `docs/DEVELOPMENT.md` | dev guide |

## Env

Validované v `src/lib/env.ts`. Lokálne preferuj mock (viď root `AGENTS.md`).  
`yarn pull:env` / `yarn setup:env` pre Vercel secrets (nikdy do gitu).

## Test strategy

1. Unit/type: `yarn type-check` + `yarn test:unit`
2. Integrity mock: `yarn test:woo:integrity` / `yarn test:integrity`
3. Live (opatrne): `yarn test:e2e:live`, `yarn production:smoke`
4. Full local gate: `yarn test:all:local`

## When user asks for UI change

1. Cituj UI FREEZE z `AGENTS.md`
2. Opýtaj sa na explicitné unfreeze
3. Až potom meň components

## Shipping checklist

- [ ] type-check clean
- [ ] relevant integrity tests green
- [ ] no secrets in diff
- [ ] STATUS/TODO update ak meníš produktový stav
