# GrowMedica — TODO

**Aktualizované:** 16. júl 2026
**Projekt:** `Growmedica-front+DASHBOARD/growmedica-wordpress-dashboard`  
**GitHub:** `youh4ck3dme/growmedica-wordpress-dashboard`  
**Branch:** `feat/dashboard-agent-v2` (pracovný branch, lokálne zmeny bez commitu/pushu)
**Produkcia:** https://www.growmedica.cz  
**Vercel preview:** https://growmedica-wordpress-dashboard.vercel.app  
**Plán:** `.cursor/plans/doména_growmedica.cz_59c53b31.plan.md`

---

## ⛔ UI/UX FREEZE

Storefront UI sa **nemení** — žiadne redesigny, layouty, farby, spacing ani animácie mimo i18n prekladov.

| Povolené | Zakázané |
|----------|----------|
| Doména, env, BFF routes, testy, docs | Zmena layoutu/štýlu v `src/components/**` |
| Shopify / WordPress integrácia | Úprava `globals.css` design tokenov |
| Dashboard Agent, SEO, i18n kľúče | Nové UI sekcie, hero, header/footer |

Referencia: [UI_UX_DESIGN_SYSTEM.md](./growmedica-wordpress-dashboard/storefront/UI_UX_DESIGN_SYSTEM.md) · [DEVELOPMENT.md](./growmedica-wordpress-dashboard/storefront/docs/DEVELOPMENT.md)

---

## Súhrn stavu

| Oblasť | Stav | Poznámka |
|--------|------|----------|
| **Produkcia www.growmedica.cz** | ✅ Live | Shopify katalóg, `/api/products` OK |
| **Shopify Storefront (tokenless)** | ✅ | `SHOPIFY_STOREFRONT_TOKENLESS=1` na Vercel |
| **Shopify Admin API (client credentials)** | ✅ Funkčné | App released/install; 4 required read/write scopes udelené |
| **Dashboard (Mistral + Nexus)** | ✅ Hybrid | https://www.growmedica.cz/dashboard |
| **SEO hreflang / canonical** | ✅ | `HreflangLinks` + testy `test:seo` |
| **i18n SK/EN/DE** | ✅ | middleware + 9 testov |
| **DNS apex `growmedica.cz`** | 🟡 | `www` funguje; A záznam `@` ešte WebSupport |
| **WordPress produkcia** | 🟡 CMS up | `cms.growmedica.cz` WP 7.0; e-shop stále Shopify |
| **Nexus Shopify env** | ✅ | Lovable Secrets: Client ID/Secret, domain, API 2026-07; read-only test OK |
| **Git** | 🟡 | Commit na `feat/dashboard-agent-v2` (push podľa potreby) |

---

## 🟡 Ďalší krok — Nexus publish + storefront deploy

Shopify Admin + Lovable Secrets sú GO (client_credentials, API 2026-07, scopes OK). Admin login: **`erikbabcan@gmail.com`**.

1. Overiť `ADMIN_EMAILS=erikbabcan@gmail.com` v Lovable (maskované).
2. **Publish/deploy Nexus** (Lovable) keď chceš iframe naživo s novým kódom.
3. **Deploy storefront** — AI recommend fix (`min(2)`, ľudské errory) ešte nie je na produkcii.
4. Voliteľne: live write smoke až po vedomom schválení (nie bulk).

Overenie storefront repozitára:

```bash
cd growmedica-wordpress-dashboard/storefront
yarn shopify:admin-verify          # Admin API + required scopes
node scripts/fix-shopify-inventory.mjs --dry-run --limit=1
```

Detail: [storefront/docs/poznamky.md](./growmedica-wordpress-dashboard/storefront/docs/poznamky.md)

---

## Výsledky testov (16.7.2026)

| Test | Výsledok | Poznámka |
|------|----------|----------|
| `yarn type-check` | ✅ PASS | |
| `yarn build` | ✅ PASS | ESLint warnings (unused vars), nie blokery |
| `yarn test:unit-integrity` | ✅ PASS | seo, i18n-detect, copy-quality, cart-id |
| `yarn test:seo` | ✅ PASS | alternates + hreflang HTML |
| `yarn test:i18n` | ✅ PASS | middleware (9 testov) |
| `yarn test:dashboard-agent` | ✅ PASS | mock Mistral (6 testov) |
| `yarn test:shopify-live` | ✅ | integrity proti live API |
| `yarn woo:smoke` | ✅ PASS | lokálny WP :8080 |
| `yarn diagnostic` | 🟡 | `:5555` dev server musí bežať pre full PASS |
| Live `/api/products` | ✅ | https://www.growmedica.cz/api/products |
| `yarn shopify:admin-verify --json` | ✅ PASS | client credentials; API `2026-07` exact; 4 required scopes |
| Admin inventory dry-run (`--limit=1`) | ✅ PASS | iba plán; žiadny live zápis |

### Rýchle testy

```bash
cd growmedica-wordpress-dashboard/storefront
yarn diagnostic                    # type-check + woo:smoke + i18n (~30s)
yarn test:unit-integrity           # unit integrity bez webservera
yarn test:seo                      # hreflang + canonical
yarn test:i18n                     # middleware locale routing
yarn test:dashboard-agent          # Mistral agent mock
yarn build                         # produkčný build
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
```

---

## S. Shopify — live katalóg + Admin API ✅ / Nexus 🟡

> Katalóg na growmedica.cz ide zo **Shopify Storefront API** (tokenless).  
> Admin onboard/inventory skripty preferujú serverové `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`; krátkodobý token získajú automaticky. Legacy `shpat_` ostáva iba fallback.

Detail: [SHOPIFY_LIVE.md](./growmedica-wordpress-dashboard/storefront/docs/SHOPIFY_LIVE.md) · [poznamky.md](./growmedica-wordpress-dashboard/storefront/docs/poznamky.md)

### Hotové ✅

- [x] **S1-storefront** — tokenless Storefront na Vercel, live katalóg na www
- [x] **S1-tools** — `yarn setup:env`, `yarn shopify:smoke`, `yarn shopify:collections-audit`
- [x] **S2-script** — `yarn vercel:shopify-env` / `set-shopify-vercel-env.sh`
- [x] **S2-deploy** — produkcia na www.growmedica.cz so Shopify
- [x] **S4-fix** — product detail 500 (ACCESS_DENIED fields), cart cookie 500
- [x] **S5-admin-scripts** — `shopify:admin-onboard`, `shopify:admin-verify`, `shopify:admin-fix`
- [x] **S6-docs** — poznamky.md, poznamky-agent.md, PRODUCTION_CHECKLIST
- [x] **S6-test** — `shopify-live.spec.ts`, live `/api/products`

### Admin hotové ✅ / Nexus zostáva 🟡

- [x] **S7-admin-install** — `GrowMedica Nexus` released + installed/reapproved; `read_products`, `write_products`, `read_inventory`, `write_inventory` granted
- [x] **S7-admin-vercel** — `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` na Production/Preview/Development; legacy Admin token odstránený
- [ ] **S8-nexus** — whitelist admin účtu + server-side client-credentials exchange + Test pripojenia
- [ ] **S9-scopes** — voliteľne pridať Storefront scopes pre sklad (`quantityAvailable`) a metafields

```bash
cd growmedica-wordpress-dashboard/storefront
yarn shopify:admin-onboard --json                   # credentials číta zo secure env/.env.local
yarn shopify:admin-verify
SHOPIFY_STOREFRONT_TOKENLESS=1 yarn shopify:smoke
node scripts/fix-shopify-inventory.mjs --dry-run --limit=1
```

**Tokeny:**

| Credential | Kam | Na čo |
|------------|-----|-------|
| Storefront / tokenless | Vercel | E-shop, čítanie katalógu |
| Admin Client ID + Secret | server-only `.env.local` + Vercel | Vytvorenie krátkodobého Admin tokenu pre write tools |
| Legacy `shpat_` | iba fallback, server-only | Starší Admin flow |

---

## D. Doména a Vercel produkcia

- [x] **D1** — Vercel projekt `growmedica-wordpress-dashboard` (scope h4ck3d)
- [x] **D2** — Domény pridané na Vercel (`growmedica.cz`, `www.growmedica.cz`)
- [x] **D3** — Production deploy: `vercel --prod`
- [x] **D4** — Live Shopify env (`CMS_PROVIDER=shopify`, tokenless)
- [x] **D5** — `www.growmedica.cz` funguje (katalóg, dashboard, API)
- [ ] **D6** — WebSupport DNS: A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`
- [ ] **D7** — Overiť SSL apex: `curl -I https://growmedica.cz`
- [ ] **D8** — Mistral live env na Vercel: `MISTRAL_MOCK_MODE=0` + produkčný smoke agenta
- [ ] **D9** — `NEXT_PUBLIC_DASHBOARD_MODE=hybrid` overiť na Vercel (kód default hybrid ✅)

Skript: `cd storefront && ./scripts/setup-growmedica-cz-domain.sh --deploy`

Detail: [PRODUCTION_CHECKLIST.md](./growmedica-wordpress-dashboard/PRODUCTION_CHECKLIST.md)

---

## E. Mistral Dashboard Agent

### Hotové ✅

- [x] API routes: `/api/dashboard/agent`, `/audit`, `/export/[id]`, `/session`
- [x] 6 Playwright testov (mock) + live spec (skip bez API key)
- [x] Tools: catalog read, copy optimize, SEO, bulk prices (dry-run), CSV export, integration status
- [x] UI: Command Bar, Audit Log, hybrid tabs (AI + Lovable Nexus iframe)
- [x] Session auth cez httpOnly cookie
- [x] i18n preklady agent UI (SK/EN/DE)
- [x] Error handling: Mistral timeout/rate limit
- [x] Audit log persistencia (Upstash Redis fallback in-memory)
- [x] Live smoke script: `scripts/mistral-agent-live-smoke.mjs`

### Zostáva

- [ ] **E1** — Live Mistral smoke na produkcii (manuálne v /dashboard)
- [ ] **E2** — `bulk_update_prices` s `confirm: true` proti live Shopify (staging only)
- [ ] **E3** — Upstash Redis pre conversation memory (voliteľné)

---

## C. WordPress produkcia — 🟡 CMS UP / shop na Shopify

> **Live e-shop ostáva Shopify** (`CMS_PROVIDER=shopify` na Vercel).  
> CMS: `https://cms.growmedica.cz` (WP 7.0, `sub/cms`, root `web/` prázdne).  
> DB credentials: gitignored `wordpress.local.md` + `wordpress-production.local.env` (live DB po reinstall 2026-07-16 — **nie** staré `sj2U8Axv`).  
> Next.js **nepoužíva** MySQL; `DB_*` nikdy na Vercel.

- [x] **C0** — `DB_*` doplnené do `wordpress-production.local.env` z live `wp-config.php`
- [x] **C1** — DNS `cms` → `37.9.175.131` + SSL LE — **live 200** (https://cms.growmedica.cz)
- [x] **C1b** — Root FTP WP zmazaný; `web/` prázdne; apex = Vercel
- [ ] **C1c** — WebSupport Shell znova aktivovať (port ~29267, ~60 min) → `scripts/setup-cms-production.sh`
- [ ] **C2** — WooCommerce + permalinky produktov + REST API keys (`ck_`/`cs_`) — voliteľné (`--with-woo`)
- [ ] **C3** — Mu-plugins: `growmedica-cors.php`, `growmedica-revalidate.php` (cez shell skript / FTP)
- [ ] **C4** — CSP `frame-ancestors` pre wp-admin embed (growmedica.cz, vercel.app)
- [ ] **C5** — Import (len ak WP bude katalóg) / inak skip — master = Shopify
- [ ] **C6** — Vercel WP env **až pri cutoveri** (`WORDPRESS_BASE_URL` + Woo keys, **nie** `DB_*`)

Detail: [WORDPRESS_SETUP.md](./growmedica-wordpress-dashboard/WORDPRESS_SETUP.md) · [wordpress.local.md](./growmedica-wordpress-dashboard/wordpress.local.md)

---

## F. i18n — dočistenie

- [ ] **F1** — Doplniť `t()` v product detail tabs, FAQ, zvyšné hardcoded SK stringy
- [ ] **F2** — E2E/manuálne SK/EN/DE na `/produkty` a `/kosik`

---

## G. Dokumentácia a cleanup

- [x] **G0** — UI freeze v docs, `AGENTS.md`, `DEVELOPMENT.md`
- [x] **G1** — SEO hreflang doc v `I18N.md`
- [x] **G2** — Shopify admin runbook (`poznamky.md`, `poznamky-agent.md`)
- [ ] **G3** — `README-vercel.md` — legacy `growmedicanextjs` → `growmedica-wordpress-dashboard`
- [x] **G4** — `PRODUCTION_CHECKLIST.md` — client-credentials cutover + verifikácia Admin API
- [ ] **G5** — `diagnostic.sh` — legacy URL cleanup
- [ ] **G6** — ESLint unused-import warnings (bez zmeny správania)

---

## H. Voliteľné (nízka priorita)

- [ ] **H1** — Customer Account API OAuth callback (`/api/auth/shopify/callback`)
- [x] **H2** — Dev Dashboard Client ID/Secret namiesto `shpat_` (server-side client credentials)
- [ ] **H3** — WPGraphQL namiesto REST (performance fáza 2)
- [ ] **H4** — Next.js 16 `images.qualities` config (dev warning)
- [ ] **H5** — Odstrániť Shopify rollback po stabilnom provoze

---

## ✅ Hotové — nemusíš riešiť

| Oblasť | Detail |
|--------|--------|
| Shopify live katalóg | www.growmedica.cz — tokenless Storefront API |
| CMS provider switch | `src/lib/cms.ts` — Shopify + WordPress fallback |
| Unified catalog | `src/lib/catalog/` |
| Košík / checkout BFF | Shopify + Woo mock (dev) |
| Dashboard hybrid shell | `DashboardShell` — Mistral + Lovable Nexus |
| SEO hreflang | `HreflangLinks`, `buildHreflangLinks`, `test:seo` |
| i18n core | SK/EN/DE middleware + testy |
| Playwright integrity | woo, i18n, dashboard-agent, shopify-live, seo |
| Doména v kóde | brand `.cz`, env, Logo, URL fallbacky |
| Bugfixy 15.7. | cart cookie 500, product ACCESS_DENIED, cookie banner removed |
| Admin onboard skripty | onboard / verify / fix-403 |
| Vercel h4ck3d deploy | production na www.growmedica.cz |
| Git B1–B2 | commit + push feat/dashboard-agent-v2 |

---

## Poradie vykonania

```
S8     Nexus whitelist + server env/test      (čaká na voľbu admin účtu)
  ↓
D6–D9  DNS apex + Mistral live smoke         (~30 min)
  ↓
E1–E2  Dashboard agent live overenie         (~20 min)
  ↓
F1–F2  i18n dočistenie                       (paralelne)
  ↓
G3–G6  Docs + cleanup                        (po cutover)
  ↓
C1–C5  WordPress produkcia                   (paused — až po Shopify admin)
  ↓
H1–H5  Voliteľné                             (neskôr)
```

---

## 🤖 Prompty pre ďalšie AI sessions

### Prompt 1 — Nexus client credentials dokončiť

```
Projekt: Growmedica-front+DASHBOARD/growmedica-wordpress-dashboard/storefront
UI/UX FREEZE: NEMEŇ komponenty ani CSS.

Cieľ: Dokončiť Nexus Shopify integráciu. Storefront Admin API už funguje cez client credentials.

1. Potvrď admin Google účet a pridaj ho do serverového ADMIN_EMAILS.
2. Nexus server env: SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_API_VERSION.
3. Implementuj server-side client_credentials exchange; secret nikdy neposielaj do browsera ani DB formulára.
4. V Nexus UI spusti Test pripojenia a over Storefront + Admin.
5. S8 označ hotové až po úspešnom teste.

Referencie: storefront/docs/poznamky.md, Nexus src/lib/shopify.functions.ts
```

### Prompt 2 — Mistral Agent live test

```
Projekt: growmedica-wordpress-dashboard/storefront
Cieľ: Otestovať Mistral Dashboard Agent s LIVE API na produkcii.

Env (Vercel):
  CMS_PROVIDER=shopify
  SHOPIFY_STOREFRONT_TOKENLESS=1
  MISTRAL_MOCK_MODE=0
  MISTRAL_API_KEY=<produkčný>
  NEXT_PUBLIC_DASHBOARD_MODE=hybrid

Kroky:
1. Otvor https://www.growmedica.cz/dashboard
2. Otestuj: "Zobraz produkty", "Stav integrácie", "Export CSV katalógu"
3. curl POST /api/dashboard/agent s x-dashboard-agent-secret
4. Zapíš výsledky

Bezpečnosť: bulk_update_prices s confirm=true len staging.
Referencia: storefront/docs/DASHBOARD_AGENT.md
```

### Prompt 3 — DNS apex cutover

```
Projekt: growmedica-wordpress-dashboard/storefront
Cieľ: Prepnúť apex growmedica.cz na Vercel.

1. WebSupport: A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com
2. Odstrániť starý A záznam (37.9.175.131 / growmedicanextjs)
3. Po propagácii: curl -I https://growmedica.cz
4. PREVIEW_URL=https://growmedica.cz yarn production:smoke
5. Aktualizuj PRODUCTION_CHECKLIST.md

Skript: ./scripts/setup-growmedica-cz-domain.sh --deploy
```

### Prompt 4 — i18n final pass

```
Projekt: growmedica-wordpress-dashboard/storefront
UI FREEZE: len locales/*.json a t() volania.

1. Nájdi hardcoded SK stringy v src/
2. Presuň do locales/sk.json, en.json, de.json
3. yarn test:i18n && yarn test:seo
4. Manuálne ?lang=sk|en|de na /produkty, /kosik

Referencia: storefront/docs/I18N.md
```

---

## Mimo rozsahu

- Staré reporty v `reports/` (`growmedical.sk`) — historické
- Nexify staging domény v CSP — legacy fallback
- `wordpress-data/`, `.env.local` — gitignored, lokálne only
- Starý projekt `growmedicanextjs` na Vercel — postupne vyradiť
