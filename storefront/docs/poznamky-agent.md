# Agent runbook — Shopify Admin client credentials

Ľudský návod: [poznamky.md](./poznamky.md)  
Strojový workflow: [poznamky-agent.json](./poznamky-agent.json)

## Kedy spustiť

User chce overiť alebo nastaviť Shopify Admin zápis, Nexus Shopify integráciu, inventory skript alebo opraviť `403 API Access has been disabled`.

## Pipeline

Credentials majú byť v secure env alebo gitignored `.env.local`; secret nedávaj do CLI argumentu:

```bash
cd storefront
yarn shopify:admin-onboard --json
```

Legacy fallback je `SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_…`, ale preferovaný flow používa `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`.

| Krok | Akcia |
|------|-------|
| `.env.local` | uloží Client ID/Secret s módmi `0600`, odstráni legacy Admin token |
| Admin API | vymení credentials za krátkodobý token, overí `shop.json` |
| Scopes | overí `read_products`, `write_products`, `read_inventory`, `write_inventory` |
| Vercel | Shopify base env + ID/Secret → Production, Preview, Development; secret sensitive/server-only |
| Storefront | spustí tokenless Shopify smoke |

Flags: `--no-vercel`, `--skip-smoke`, `--verify-only`, `--json`. Client secret sa prijíma iba cez secure env alebo `.env.local`, nie cez CLI argument.

## Human handoff

| ID | Kedy |
|----|------|
| `shopify_client_credentials` | chýba/nefunguje pár Client ID/Secret |
| `shopify_admin_scopes` | chýbajú required scopes; Release + Update access |
| `nexus_env` | Nexus potrebuje admin whitelist a server-side token exchange |

JSON report zahŕňa:

```json
{
  "status": "ok | blocked",
  "credential_mode": "client_credentials | admin_token | missing",
  "admin_api": "ok | 403_api_disabled | 401_unauthorized | missing_credentials | api_version_fallback",
  "admin_scopes": "ok | missing_scopes | scope_check_error",
  "pending_human": []
}
```

## Pravidlá

- Nikdy necommituj `.env.local`, `SHOPIFY_CLIENT_SECRET`, transient token ani legacy `shpat_`.
- Admin credentials nikdy nevkladaj do `SHOPIFY_STOREFRONT_ACCESS_TOKEN` alebo `NEXT_PUBLIC_*`.
- UI komponenty ani design tokeny nemeň.
- Storefront ostáva `SHOPIFY_STOREFRONT_TOKENLESS=1`.
- Nexus secret musí zostať server-side; transient token neukladaj do browser formulára/Vercel env.
- Live `--apply` alebo bulk zmena vyžaduje samostatné schválenie.

## Overenie

```bash
yarn shopify:admin-verify --json
SHOPIFY_STOREFRONT_TOKENLESS=1 yarn shopify:smoke
node scripts/fix-shopify-inventory.mjs --dry-run --limit=1
yarn type-check
```
