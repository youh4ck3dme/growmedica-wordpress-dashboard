# Poznámky — Shopify Admin client credentials + Nexus

E-shop na [growmedica.cz](https://www.growmedica.cz) číta katalóg cez tokenless Storefront API. Admin onboard/inventory flow používa serverové Dev Dashboard credentials: `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`; skripty si z nich vyžiadajú krátkodobý access token. Legacy `SHOPIFY_ADMIN_ACCESS_TOKEN` (`shpat_…`) ostáva iba fallback.

> **Woo merchant API (Packeta, Stripe/karta, SuperFaktúra, GoPay, DPD)** — nie Shopify:  
> **[docs/MERCHANT_KEYS.md](../../docs/MERCHANT_KEYS.md)**  
> Pre AI agenta (Shopify): [poznamky-agent.md](./poznamky-agent.md) · `yarn shopify:admin-onboard --json` · [poznamky-agent.json](./poznamky-agent.json)

## Overený stav — 16. júl 2026

| Oblasť | Stav |
|--------|------|
| Storefront tokenless katalóg | ✅ live |
| Dev Dashboard app `GrowMedica Nexus` | ✅ released + installed/reapproved |
| Admin REST `shop.json` | ✅ `GrowMedica Slovakia` |
| Shopify API version | ✅ `2026-07`, exact response header; bez silent fall-forward |
| Required Admin scopes | ✅ `read_products`, `write_products`, `read_inventory`, `write_inventory` |
| `.env.local` | ✅ client ID/secret, mód `0600`, bez legacy Admin tokenu |
| Vercel storefront projekt | ✅ ID/secret na Production, Preview, Development |
| Admin inventory smoke | ✅ dry-run pre 1 variant; žiadny live zápis |
| Nexus | 🟡 čaká na admin whitelist + server-side client-credentials exchange |

## Shopify Admin a lokálny/Vercel onboarding

App je v [Shopify Dev Dashboard](https://dev.shopify.com/dashboard/220990502/apps/378076692481/settings). Ak sa scopes alebo app verzia neskôr zmenia, treba verziu **Release**, následne v obchode potvrdiť **Install/Update access**.

Bezpečné lokálne minimum v `.env.local`:

```bash
CMS_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com
SHOPIFY_STOREFRONT_TOKENLESS=1
SHOPIFY_CLIENT_ID=<server-only>
SHOPIFY_CLIENT_SECRET=<server-only>
SHOPIFY_API_VERSION=2026-07
```

Credentials nevkladaj do CLI argumentov ani do browser premenných. Keď už sú v secure env alebo `.env.local`:

```bash
cd storefront
yarn shopify:admin-onboard --json
yarn shopify:admin-verify --json
SHOPIFY_STOREFRONT_TOKENLESS=1 yarn shopify:smoke
node scripts/fix-shopify-inventory.mjs --dry-run --limit=1
```

`shopify:admin-verify` kontroluje REST prístup, presnú API verziu aj všetky štyri required scopes. Onboard uloží bezpečné Shopify nastavenia a Client ID/Secret do `.env.local` a Vercel Production/Preview/Development a odstráni legacy `SHOPIFY_ADMIN_ACCESS_TOKEN`. Dry-run iba vypíše plán; nepoužívaj `--apply` bez samostatného schválenia live zmien.

| Výstup | Význam |
|--------|--------|
| `admin_api: ok`, `admin_scopes: ok` | Admin API aj write scopes sú pripravené |
| `403_api_disabled` | App nie je nainštalovaná/aktívna; Release + Install/Update access |
| `missing_scopes` | Release verziu so scopes a znovu potvrď access v obchode |
| `api_version_fallback` | Konfigurovaná verzia je vyradená; pinni podporovanú verziu a zopakuj smoke |
| `401_unauthorized` | Client credentials alebo legacy token sú neplatné/revoked |

## Nexus (Lovable/Vercel)

Nexus je samostatný projekt: [growmedica-nexus.lovable.app/admin](https://growmedica-nexus.lovable.app/admin). Produkčný stav z 16. júla:

- `ADMIN_EMAILS` key existuje, ale produkčnú encrypted hodnotu CLI neodhalí; ani jeden z ponúkaných Google účtov nie je potvrdený lokálnym kódom/configom;
- Nexus kód číta iba `SHOPIFY_ADMIN_ACCESS_TOKEN`;
- `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` ani legacy Admin token nie sú nastavené;
- formulár vie uložiť trvalý Admin token do integračnej konfigurácie, čo nie je vhodné pre 24-hodinový client-credentials token.

S8 potrebuje tieto serverové premenné:

| Premenná | Hodnota / pravidlo |
|----------|--------------------|
| `ADMIN_EMAILS` | potvrdený Google účet používateľa |
| `SHOPIFY_STORE_DOMAIN` | `growmedica.myshopify.com` |
| `SHOPIFY_CLIENT_ID` | Dev Dashboard app ID, server-only |
| `SHOPIFY_CLIENT_SECRET` | Dev Dashboard secret, sensitive/server-only |
| `SHOPIFY_API_VERSION` | `2026-07` |

Nexus musí na serveri zavolať `POST https://growmedica.myshopify.com/admin/oauth/access_token` s grantom `client_credentials`, token držať iba krátkodobo v serverovej pamäti/cache a potom spustiť **Test pripojenia**. Client secret ani transient token nepatria do client-visible env, browser formulára alebo git repozitára.

Ak Nexus ostane iba na legacy `SHOPIFY_ADMIN_ACCESS_TOKEN`, technicky potrebuje samostatný platný `shpat_`; krátkodobý OAuth token nekopíruj do Vercel env, pretože približne po 24 hodinách expiruje.

## Storefront a iframe diagnostika

| Problém | Riešenie |
|---------|----------|
| Katalóg prázdny | `SHOPIFY_STOREFRONT_TOKENLESS=1 yarn shopify:smoke` a [produkčné API](https://www.growmedica.cz/api/products) |
| Nexus login `Forbidden` | over serverový `ADMIN_EMAILS` whitelist |
| Prázdny iframe/login | Firebase Authorized domains: `growmedica.cz`, `www.growmedica.cz`, Vercel a Nexus doména |
| `Refused to frame` | Nexus `ALLOWED_FRAME_ANCESTORS`; pozri [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md) |

## Bezpečnosť

- `.env.local` musí zostať gitignored a s právami `0600`.
- `SHOPIFY_CLIENT_SECRET`, transient token ani legacy `shpat_` nikdy necommituj, neloguj a neposielaj do klienta.
- Admin credentials nikdy nedávaj do `SHOPIFY_STOREFRONT_ACCESS_TOKEN` ani `NEXT_PUBLIC_*`.
- Storefront ostáva `CMS_PROVIDER=shopify` + tokenless; kvôli Admin chybe neprepínaj produkciu na WordPress/mock.
- Produkčný zápis (`--apply`, bulk ceny/sklad) vyžaduje samostatné schválenie a najprv úzky dry-run.

## Odkazy

- [Shopify Admin — apps](https://admin.shopify.com/store/growmedica/settings/apps)
- [Shopify Dev Dashboard — GrowMedica Nexus](https://dev.shopify.com/dashboard/220990502/apps/378076692481/settings)
- [Storefront produkcia](https://www.growmedica.cz/produkty)
- [Dashboard produkcia](https://www.growmedica.cz/dashboard)
- [Nexus admin](https://growmedica-nexus.lovable.app/admin)
- [Shopify live dokumentácia](./SHOPIFY_LIVE.md)
