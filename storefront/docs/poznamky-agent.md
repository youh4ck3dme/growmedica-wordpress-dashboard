# Agent runbook — Shopify Admin token (`shpat_`)

Ľudský návod: [poznamky.md](./poznamky.md)  
Strojový workflow: [poznamky-agent.json](./poznamky-agent.json)

## Kedy spustiť

User chce: Admin token, `shpat_`, Nexus Shopify, bundle skripty, zápis do Shopify.

## Jedna automatická pipeline

```bash
cd storefront
yarn shopify:admin-onboard --token "shpat_..." --json
```

Alebo token už v env / `.env.local`:

```bash
yarn shopify:admin-onboard --json
```

### Čo agent spraví sám

| Krok | Príkaz / akcia |
|------|----------------|
| `.env.local` | doplní Shopify live + `SHOPIFY_ADMIN_ACCESS_TOKEN` |
| Overenie Admin API | GraphQL `{ shop { name } }` |
| Vercel | `SHOPIFY_ADMIN_ACCESS_TOKEN` → production, preview, development |
| Smoke | `shopify-smoke-test.mjs` |

Flags: `--no-vercel`, `--skip-smoke`, `--verify-only`, `--json` (iba JSON na stdout).

## Čo agent NEMÔŽE (vždy human handoff)

| ID | URL |
|----|-----|
| `shopify_create_token` | [Develop apps](https://admin.shopify.com/store/growmedica/settings/apps/development) |
| `nexus_env` | [Nexus admin](https://growmedica-nexus.lovable.app/admin) alebo [lovable.dev](https://lovable.dev) |
| `iframe_firebase` | [Firebase Console](https://console.firebase.google.com/) |

## Rozhodovacia logika (JSON report)

```json
{
  "status": "ok | partial | blocked",
  "admin_api": "ok | 403_api_disabled | 401_unauthorized | missing_token",
  "pending_human": [{ "id": "...", "message": "...", "url": "..." }]
}
```

| `admin_api` | Agent robí |
|-------------|------------|
| `ok` | Dokončí Vercel + smoke; pripomeň `nexus_env` |
| `403_api_disabled` | **Stop.** Pošli userovi link Develop apps → Install app. Neopakuj deploy. |
| `401_unauthorized` | **Stop.** Nový token v Shopify. |
| `missing_token` | **Stop.** Požiadaj usera o `shpat_` alebo `--token`. |

## Pravidlá

- `shpat_` **nikdy** do `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- **Nikdy** necommituj `.env.local` ani token
- UI komponenty nemeň ([AGENTS.md](../../AGENTS.md))
- Storefront katalóg funguje aj bez `shpat_` (`SHOPIFY_STOREFRONT_TOKENLESS=1`)

## Overenie po onboardingu

```bash
yarn shopify:admin-onboard --verify-only --json
yarn shopify:smoke
BASE_URL=https://www.growmedica.cz node scripts/mistral-agent-live-smoke.mjs
```