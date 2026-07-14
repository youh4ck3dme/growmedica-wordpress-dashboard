# Dashboard deploy (iframe bridge)

Externý admin dashboard beží na samostatnom hostingu. Storefront ho vkladá na `/dashboard` cez full-screen iframe — bez merge admin kódu do Next.js projektu.

**Cieľ (WordPress):** `https://cms.growmedica.sk/wp-admin` alebo custom WooCommerce admin plugin route.

**Legacy (Shopify era):** growmedica-nexus na Lovable (`https://growmedica-nexus.lovable.app`).

Vzor je analogický k NOOR demo ([`NOOR_DEMO_DEPLOY.md`](./NOOR_DEMO_DEPLOY.md)): samostatný deploy, prepojenie cez env.

## Architektúra

| | Storefront (tento projekt) | WordPress CMS |
|---|---|---|
| **Stack** | Next.js 15 App Router v `storefront/` | WordPress 6.7 + WooCommerce |
| **Admin** | `/dashboard` (iframe bridge) | `/wp-admin` |
| **Produkcia** | `https://growmedica.sk/dashboard` | `https://cms.growmedica.sk/wp-admin` |

Používateľ naviguje na `https://growmedica.sk/dashboard`. URL v prehliadači zostáva `/dashboard`; navigácia v dashboarde prebieha vnútri iframe.

**Legacy:** growmedica-nexus (`https://growmedica-nexus.lovable.app/admin`) — len rollback fallback v `.env.example`.

## Storefront — env premenné

| Premenná | Príklad | Účel |
|---|---|---|
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://cms.growmedica.sk/wp-admin` | `src` atribút iframe na `/dashboard` |

Ak premenná chýba, `/dashboard` zobrazí fallback s odkazom na legacy Nexus.

### Lokálny vývoj

```bash
cd storefront
# .env.local
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:8080/wp-admin
yarn dev
```

Otvorte `http://localhost:5555/dashboard`.

### WordPress `frame-ancestors`

WordPress musí povoliť embed zo storefront originov. Do `wp-config.php` alebo security pluginu:

```
frame-ancestors 'self' https://growmedica.sk https://*.vercel.app http://localhost:5555 http://127.0.0.1:5555;
```

Ak iframe auth nefunguje (cookies third-party), použite **Application Passwords** alebo tlačidlo „Otvoriť WordPress admin priamo“ v `DashboardFrame`.

Storefront CSP (`next.config.ts`): `frame-src 'self' https://cms.growmedica.sk` pre `/dashboard`.

## Storefront — implementácia (tento repozitár)

| Súbor | Účel |
|---|---|
| `src/middleware.ts` | Nastaví **request** header `x-dashboard-route: 1` pre `/dashboard` (nie response header) |
| `src/app/layout.tsx` | Číta `headers()` v Server Component; bez shop chrome keď `x-dashboard-route === '1'` |
| `src/app/dashboard/page.tsx` | Iframe bridge alebo fallback |
| `src/app/dashboard/layout.tsx` | `noindex`, full-height wrapper |
| `next.config.ts` | Route-specific CSP `frame-src` pre `/dashboard` |
| `src/app/robots.ts` | `disallow: /dashboard` |

`/dashboard` **nie je** v `PRIMARY_NAV_LINKS` — admin route, nie verejná navigácia.

### Middleware — request header pattern

Root layout číta flag cez `headers()` v Server Component. Middleware preto musí mutovať **request** headers (nie response):

```ts
const requestHeaders = new Headers(request.headers)
requestHeaders.set('x-dashboard-route', '1')

return NextResponse.next({
  request: { headers: requestHeaders },
})
```

Response header by sa v layoute neobjavil — to bol pôvodný bug v pláne.

## growmedica-nexus — Vercel deploy (samostatný repozitár)

Tieto kroky vykonajte v repozitári **growmedica-nexus**, nie v tomto projekte.

### 1. Nový Vercel projekt

| Nastavenie | Hodnota |
|---|---|
| **Project name** | `growmedica-nexus` |
| **Git root** | koreň repa (nie `storefront/`) |
| **Build command** | `vite build` (podľa `package.json` script `build`) |
| **Output** | podľa TanStack Start / Vite konfigurácie |

### 2. Env premenné (Nexus)

Nepridávať do gitu. Názvy musia sedieť s kódom v repozitári (nie `VITE_FIREBASE_*` — Firebase config ide cez server fn `getFirebaseConfig`):

| Premenná | Povinné | Účel |
|---|---|---|
| `ADMIN_EMAILS` | áno | Comma-separated zoznam admin e-mailov pre `verifyAdminAccess` (Firebase login nestačí — e-mail musí byť v zozname) |
| `FIREBASE_API_KEY` | áno | Firebase client config (server fn, nie `VITE_`) |
| `FIREBASE_AUTH_DOMAIN` | áno | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | áno | Firebase project ID + JWT verify audience |
| `FIREBASE_APP_ID` | áno | Firebase app ID |
| `SUPABASE_URL` | áno | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | áno | Supabase anon/publishable key (server + client) |
| `SUPABASE_SERVICE_ROLE_KEY` | áno | Server-side admin operácie (integrations, webhooks) |
| `VITE_SUPABASE_URL` | odporúčané | Client-side Supabase (build-time); môže byť rovnaké ako `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | odporúčané | Client-side Supabase; môže byť rovnaké ako `SUPABASE_PUBLISHABLE_KEY` |
| `SHOPIFY_STORE_DOMAIN` | áno | Shopify store pre admin integrácie |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | áno | Shopify Admin API token |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | voliteľné | Storefront API testy z admin panelu |
| `SHOPIFY_API_VERSION` | voliteľné | Default `2025-01` |
| `ALLOWED_FRAME_ANCESTORS` | odporúčané | Extra `frame-ancestors` domény (bez `'self'`) |
| `MISTRAL_API_KEY` | nie (fáza 3) | Zatiaľ nepoužívané v kóde |

> **Poznámka:** `FIREBASE_SERVICE_ACCOUNT_JSON` v tomto repozitári **nie je** potrebné — server-side verify používa Firebase JWKS (`jose`), nie service account.

### 3. Firebase Authorized domains (manuálne v Firebase Console)

**Tento krok musí vykonať vlastník projektu v [Firebase Console](https://console.firebase.google.com/) → Authentication → Settings → Authorized domains.**

Pridajte všetky tieto domény:

| Doména | Účel |
|---|---|
| `growmedica-nexus.lovable.app` | Nexus admin (iframe `src` origin) |
| `growmedicanextjs.vercel.app` | Storefront Vercel preview/production |
| `growmedica.sk` | Storefront produkčná doména |
| `grow.nexify-studio.tech` | Storefront staging / alternatívna doména |
| `growmedica.nexify-studio.tech` | Storefront produkčná doména (katalóg `/produkty`) |

Bez toho môže Firebase login v iframe zlyhať (fáza 1 obmedzenie — third-party cookies).

### 4. Povolenie iframe embedu (frame-ancestors)

Nexus musí dovoliť, aby ho storefront vložil do iframe. Inak prehliadač zablokuje obsah (`X-Frame-Options` / CSP `frame-ancestors`).

Implementované v nexus repozitári:

- `src/lib/frame-ancestors.server.ts` — CSP `frame-ancestors` + odstránenie `X-Frame-Options`
- `src/server.ts` — aplikuje hlavičky na každú odpoveď
- `vite.config.ts` — `nitro.preset: "vercel"` pre `.vercel/output` deploy

Produkčná hodnota `ALLOWED_FRAME_ANCESTORS` (bez `'self'`, ten sa pridáva automaticky):

```
https://growmedicanextjs.vercel.app https://growmedica.sk https://*.growmedica.sk https://grow.nexify-studio.tech https://growmedica.nexify-studio.tech https://*.vercel.app http://localhost:5555 http://127.0.0.1:5555 http://localhost:8080 http://127.0.0.1:8080
```

Výsledná CSP hlavička (vrátane lokálneho storefrontu):

```
frame-ancestors 'self' https://growmedicanextjs.vercel.app https://growmedica.sk https://*.growmedica.sk https://grow.nexify-studio.tech https://growmedica.nexify-studio.tech https://*.vercel.app http://localhost:5555 http://127.0.0.1:5555 http://localhost:8080 http://127.0.0.1:8080
```

Odporúčania:

- **Odstrániť / neposielať** `X-Frame-Options: DENY` na admin routách (rieši `applyIframeEmbedHeaders`)
- Po pridaní novej storefront domény aktualizovať `ALLOWED_FRAME_ANCESTORS` vo Vercel projekte `growmedica-nexus` a redeploy

### 5. Iframe URL mapping

Nexus root `/` redirectuje na `/admin`. Storefront iframe smeruje priamo na:

```
NEXT_PUBLIC_DASHBOARD_URL = https://<nexus-host>/admin
```

Vnútorná navigácia (`/admin/produkty`, `/admin/prihlasenie`, …) zostáva v iframe — parent URL `/dashboard` sa nemení.

## Nasadené URL (2026-06-09)

| Služba | URL |
|---|---|
| **growmedica-nexus** (admin iframe) | https://growmedica-nexus.lovable.app/admin |
| **growmedicanextjs** (storefront bridge) | https://growmedicanextjs.vercel.app/dashboard |

Vercel projekty: `h4ck3d/growmedica-nexus`, `h4ck3d/growmedicanextjs`.

## Odporúčaný postup nasadenia

1. **Nexus deploy** + `frame-ancestors` headers (najprv!) — push `vercel.json` v growmedica-nexus a redeploy
2. Overiť Firebase login na priamom Nexus URL (mimo iframe)
3. Nastaviť `NEXT_PUBLIC_DASHBOARD_URL` na storefronte (Vercel Production + Preview)
4. Otestovať `https://<storefront>/dashboard` v prehliadači
5. Spustiť Playwright smoke testy (nižšie)

Ak Nexus ešte nepovolí embed, storefront iframe bude prázdny — debugujte najprv Nexus headers.

### Nexus URL status (overiť po deployi)

```bash
curl -sI https://growmedica-nexus.lovable.app/admin
```

| Stav | Význam |
|---|---|
| **HTTP 200** | Nexus nasadený, `/admin` dostupný |
| **HTTP 404 + `x-vercel-error: DEPLOYMENT_NOT_FOUND`** | Vercel projekt ešte neexistuje alebo nebol nasadený — vytvorte projekt `growmedica-nexus` a pushnite repozitár |
| **HTTP 404 bez DEPLOYMENT_NOT_FOUND** | Projekt existuje, ale route `/admin` ešte nefunguje — skontrolujte build a TanStack routy |

Posledná kontrola (pred prvým Nexus deployom): `DEPLOYMENT_NOT_FOUND` — treba nasadiť growmedica-nexus na Vercel.

## Obmedzenia fázy 1

- **Auth cookies** — Supabase/Firebase session beží v kontexte Nexus origin (third-party cookie v iframe). Prihlásenie môže v Safari/Firefox zlyhať v iframe skôr než v priamom okne. Riešenie vo fáze 2 (same-origin proxy alebo shared auth).
- **Firebase Authorized domains** — okrem Nexus hostu pridajte aj storefront domény; inak Firebase popup/redirect auth v iframe zlyhá.
- **`FIREBASE_SERVICE_ACCOUNT_JSON`** — v tomto repozitári nie je potrebné (verify cez JWKS). Ak máte starší checklist s touto premennou, ignorujte ju.
- **Deep linking** — `growmedica.sk/dashboard/admin/produkty` nebude fungovať; deep linky sú len vnútri iframe.
- **Serwist SW** — service worker sa registruje globálne, ale `/dashboard` nemá shop chrome a iframe route by nemala byť blokovaná. Po production deployi overte: DevTools → Application → Service Workers, potom načítajte `/dashboard` a skontrolujte, že iframe sa renderuje (SW neinterceptuje cross-origin iframe obsah).

## Testy

```bash
cd storefront

# Fallback keď NEXT_PUBLIC_DASHBOARD_URL nie je nastavený (default integrity run)
yarn playwright test tests/integrity/dashboard.spec.ts --project=integrity

# S nakonfigurovaným dashboard URL (iframe smoke)
yarn test:dashboard
```

Overí: HTTP 200, žiadny shop chrome, fallback alebo iframe podľa env.

## Fáza 2 (neskôr)

- Vercel rewrite proxy — `/dashboard/:path*` → Nexus s `base: '/dashboard/'`
- Monorepo / submodule
- Shared auth medzi storefront a dashboardom
