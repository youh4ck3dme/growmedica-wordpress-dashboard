# GrowMedica — Next.js + WooCommerce

> ✅ **TOTO JE JEDINÝ / HLAVNÝ GROWMEDICA PROJEKT — CANONICAL** (potvrdené 2026-08-03)
> Cesta: `/Users/erikbabcan/Growmedica-front+DASHBOARD/growmedica-wordpress-dashboard`
> Ak na `localhost:5555` vidíš produkty typu „... Mock produkt N“, si v ZLOM projekte — skontroluj `lsof -nP -iTCP:5555 -sTCP:LISTEN` a spusti `yarn dev` znova odtiaľto.
> Iné kópie v tomto workspace sú DUPLICITNÉ/ZASTARANÉ (majú `yarn dev` guard, nespustia sa bez `ALLOW_LEGACY_DEV=1`):
>
> - `growmedica-wordpress-dashboard-OLD-DO-NOT-USE` (top-level duplicate checkout)
> - `growmedica-nextjs-storefront` (starý Shopify-mock projekt)

Headless e-shop: **Next.js 15** (Vercel) + **WordPress/WooCommerce** CMS.

| | URL |
| -- | ----- |
| E-shop | <https://www.growmedica.cz> |
| CMS admin | <https://cms.growmedica.cz/wp-admin> |

> **⛔ UI/UX FREEZE** — nemeniť layout/dizajn storefrontu bez zadania.  
> **Stav a úlohy:** **[STATUS.md](./STATUS.md)** · [TODO.md](./TODO.md) · [AGENTS.md](./AGENTS.md)

---

## 🤖 AI AGENT — ČÍTAJ PRVÉ (aktualizované 2026-08-07)

Toto je **kanónický backlog** pre každého AI agenta. Pred akoukoľvek prácou si prečítaj túto sekciu + [STATUS.md](./STATUS.md) + [AGENTS.md](./AGENTS.md).

**🔴 INCIDENT:** `cms.growmedica.cz` — **Chyba pri nadväzovaní spojenia s databázou** (HTTP 500).  
Katalóg API, checkout, auth a Woo REST **nefungujú**. Runbook: [reports/CMS_DB_INCIDENT_2026-08-07.md](./reports/CMS_DB_INCIDENT_2026-08-07.md).  
**Oprava:** majiteľ / WebSupport (MySQL panel + SSH) — agent nemá `wordpress-production.local.env`.

**Produkcia:** canonical `main` @ `e230bcb` · Vercel www beží · **CMS DB down**  
**Mirror:** `you640/growmedica-nextjs-2026`  
**Shop predáva** cez BACS + COD — **⏸️ pozastavené počas CMS výpadku**. Shopify runtime **nie je**.

### Hotové (funguje na produkcii)

| # | Oblasť | Stav |
| --- | -------- | ------ |
| 1 | Homepage layout | ✅ Hero → Finder → Trust → Kategórie → Featured → Balíčky · full-bleed aj Pro Max |
| 2 | Supplement Finder (AI) | ✅ Spojený s „Prečo GrowMedica“ · 3 kroky · chipy · mobile stacked form |
| 3 | Hero slider | ✅ 4 slidy · i18n · slide 1 CTA → `/#supplement-finder` |
| 4 | Kategórie | ✅ Departments mega-menu · sidebar facets · badges · `94221fe` |
| 5 | Trust / IntentCompass | ✅ Trust badges na home · IntentCompass na non-home |
| 6 | i18n CS / SK / EN / DE | ✅ Finder, hero, trust, produkty, kontakt, legal, auth UI |
| 7 | Farmaceutický chatbot | ✅ Drawer · jazyk · product cards / warning / bundle |
| 8 | Košík | ✅ BFF cookie · `cart-client.ts` · add / sticky / bundle |
| 9 | SEO | ✅ ld+json · sitemap · robots |
| 10 | Balíčky | ✅ `/balicky` + BundleShowcase |
| 11 | Legal + content stránky | ✅ VOP, GDPR, FAQ, blog, veľkoobchod, kontakt — 200 OK |
| 12 | PWA + cookie consent | ✅ SW · offline · banner · consent-gated FAB |
| 13 | Dashboard + AI agent | ✅ Woo tools (orders, inventory, products) |
| 14 | CI/CD | ✅ GH Actions + Vercel auto-deploy · CI fix PR #15 |
| 15 | TypeScript / Woo cutover | ✅ tsc clean · Woo-only catalog |

### Nedokončené / nefunguje (treba opraviť)

| # | Problém | Závažnosť | Detail |
| --- | --------- | ----------- | -------- |
| 0 | **CMS databáza down** | 🔴 **P0 kritické** | `cms.growmedica.cz` HTTP 500 · [incident report](./reports/CMS_DB_INCIDENT_2026-08-07.md) · WebSupport MySQL |
| 1 | ~~Prihlásenie MOCK~~ | ✅ | Woo auth BFF — [storefront/docs/AUTH.md](./storefront/docs/AUTH.md) |
| 2 | ~~Profil MOCK~~ | ✅ | Reálne adresy + Woo objednávky |
| 3 | Obľúbené (wishlist) | Stredné | UI `/oblubene` + `WishlistButton` = len localStorage, bez sync s účtom. |
| 4 | Analytics | 🟡 wiring ✅ | `AnalyticsLoader` čaká na `NEXT_PUBLIC_GTM_ID` / GA4 / Pixel od majiteľa |
| 5 | ~~Meta title podstránok~~ | ✅ | layout metadata |
| 6 | Checkout = CMS redirect | Stredné (info) | Košík Next → `cms.growmedica.cz/kontrola-objednavky`. Funguje, UX skok medzi doménami. |
| 7 | Platobná brána | Info | Platba v Woo (BACS+COD). Stripe/GoPay/Comgate ešte nie. |
| 8 | Faktúry / SuperFaktúra | Info | Plugin na CMS ✅ · **API key ešte majiteľ** ([majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry)). |
| 9 | ~~Dead CSS WhyGrowMedica~~ | ✅ | odstránené |
| 10 | Untracked workspace file | Nízke | `docs/*.code-workspace` → `.gitignore`. |

### Prioritný zoznam pre AI (rob v tomto poradí)

#### P0 — kritické

0. **Obnoviť CMS MySQL** — WebSupport panel + SSH (`scripts/setup-cms-production.sh`) → potom `yarn production:smoke`  
1. ~~Reálna autentifikácia~~ ✅ — [storefront/docs/AUTH.md](./storefront/docs/AUTH.md)  
2. Analytics — wiring ✅; **majiteľ musí dodať** `NEXT_PUBLIC_GTM_ID` / GA4 / Pixel na Vercel.

#### P1 — vysoké

1. ~~Meta title~~ ✅  
2. **Wishlist** — stále localStorage-only (sync s Woo TBD).  
3. ~~Dead CSS~~ ✅

#### P2 — stredné

1. Overiť **Woo e-mail notifikácie** (branding).  
2. Overiť **product reviews** napojenie na Woo.  
3. Overiť **search UX** `/vyhladavanie` (relevantnosť Woo API).

#### P3 — nice-to-have

1. Theme switcher noor/classic (user-facing?) — rozhodnúť.  
2. Blog obsah (WP posts).  
3. Veľkoobchod — B2B formulár / registrácia.  
4. Upstash Redis (`UPSTASH_REDIS_REST_TOKEN` prázdny) — rate-limit / cache.  
5. Workspace file v `.gitignore`.

### Pravidlá pre AI pri práci na backlogu

- Pred UI zmenami: **UI/UX FREEZE** — [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md). Auth/analytics/meta = výnimka so schválením, ak mení JSX.  
- Secrets **nikdy** do gitu.  
- Po hotovej úlohe: aktualizuj túto sekciu + [STATUS.md](./STATUS.md) + [TODO.md](./TODO.md) + [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md).  
- Commit → push → PR/merge na `main` (Vercel Production auto-deploy).  
- Detail prevádzky: [docs/OPERATIONS.md](./docs/OPERATIONS.md).

---

## Stav (skrátka)

| Oblasť | Stav |
| --- | --- |
| Storefront UI (Next.js 15, PWA, AI) | ✅ |
| Geo-lokalizácia UI (CS / SK / EN / DE) | ✅ |
| WordPress/WooCommerce integrácia | ✅ `CMS_PROVIDER=wordpress` |
| Unified catalog provider | ✅ `src/lib/catalog/` |
| Košík + checkout BFF | ✅ WooCommerce session |
| Dashboard → WP admin + Woo agent | ✅ `/dashboard` |
| ISR webhooks | ✅ mu-plugin + `/api/revalidate` |
| Playwright Woo testy | ✅ `yarn test:woo:integrity` |
| SEO taxonomy + redirects | ✅ `/kategorie`, freeze 1.1.0 |
| Auth / profil | ✅ Woo BFF · wishlist stále localStorage |
| Analytics (GTM/GA4) | 🟡 wiring · čaká na ID od majiteľa |
| Shopify integrácia | 🗑️ Runtime odstránený (legacy docs only) |

| | |
| -- | -- |
| Katalóg | ✅ Woo (`CMS_PROVIDER=wordpress`) |
| Košík | ✅ cookie BFF → cms checkout |
| Platby | ✅ BACS + COD · ⬜ Stripe/GoPay (karty) |
| Doprava SK | ✅ flat rates · ⬜ Packeta/DPD map API |
| Faktúry | ✅ SuperFaktúra plugin · ⬜ API (**[majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry)** body 2a–2j) |
| Firma / e-maily | ✅ [docs/vzorfirma.md](./docs/vzorfirma.md) |
| **Merchant API (ty)** | **[docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)** — Packeta, karta, SF, GoPay, DPD |
| **Majiteľ (ľudsky)** | **[majitel.md](./majitel.md)** — checklist čo dodať a kde to získať (SF: **2a–2k**) |

## Quick start

```bash
cd storefront
yarn install
cp .env.example .env.local   # mock hodnoty stačia na dev
yarn dev                     # http://localhost:5555
# alebo: yarn clean:dev      # free porty + čistý .next
```

### Produkčný WordPress režim (env)

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin
NEXT_PUBLIC_SITE_URL=https://www.growmedica.cz
NEXT_PUBLIC_DEFAULT_LOCALE=cs
```

Secrets **nikdy do gitu** — len `.env.local` / `wordpress-production.local.env`.

### i18n (CS / SK / EN / DE)

UI texty sa prekladajú podľa geo / cookie / `Accept-Language`. URL slugy (`/produkty`, `/kolekcie`) sa nemenia.

| Priorita | Zdroj |
| ---------- | -------- |
| 1 | `?lang=cs\|sk\|en\|de` (nastaví cookie, redirect) |
| 2 | Cookie `growmedica_locale` (30 dní) |
| 3 | `x-vercel-ip-country` (CZ→cs, SK→sk, DE/AT/CH→de, ostatné→en) |
| 4 | `Accept-Language` (`cs` pred `sk`) |
| 5 | `NEXT_PUBLIC_DEFAULT_LOCALE` (fallback: `cs`) |

Prepínač v headeri ukazuje **len aktuálny locale**; po kliknutí dropdown CS / SK / EN / DE.

Detailná dokumentácia: [storefront/docs/I18N.md](./storefront/docs/I18N.md)

### Lokálny WordPress (Docker)

```bash
docker compose up -d
# http://localhost:8080/wp-admin
```

Pozri [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md).

## Testy a smoke

```bash
cd storefront
yarn type-check
yarn diagnostic
yarn test:woo:integrity      # Woo mock integrity
yarn test:e2e:live           # produkčný nákup www → cms
yarn production:smoke        # PREVIEW_URL=https://www.growmedica.cz
```

Testy: `storefront/tests/` · [tests/README.md](./storefront/tests/README.md) · prompt: [docs/PROMPT_TESTS.md](./docs/PROMPT_TESTS.md)

## Štruktúra

```text
growmedica-wordpress-dashboard/
├── README.md                 # ← AI AGENT backlog (hore) + quick start
├── STATUS.md                 # ← živý stav + majiteľ / agent úlohy
├── TODO.md
├── AGENTS.md                 # pravidlá pre AI (Cursor Cloud)
├── PRODUCTION_CHECKLIST.md
├── docs/MERCHANT_KEYS.md     # ← Packeta / karta / SuperFaktúra / GoPay (ty)
├── docs/SUPERFAKTURA_SETUP.md
├── docs/OPERATIONS.md        # endpointy, env, prevádzka
├── docs/vzorfirma.md         # firma / banka
├── reports/                  # aktuálne reporty (+ seo-taxonomy/)
│   └── CO_DOROBIT.md         # súhrn čo dorobiť
├── storefront/               # Next.js app
│   ├── src/lib/catalog/      # unified CMS
│   ├── src/lib/wordpress/    # Woo client + cart
│   └── docs/                 # DEVELOPMENT, WOO_CART, I18N, DASHBOARD_*
├── wordpress/mu-plugins/     # CORS + revalidate + checkout seed
└── scripts/                  # CMS setup
```

## Dokumentácia

| Dokument | |
| ---------- | -- |
| [STATUS.md](./STATUS.md) | **Hlavný stav + backlog** |
| **[majitel.md](./majitel.md)** | **Pre majiteľa: čo dodať, kde získať, kam vložiť** |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | **Endpointy, env, prevádzka** |
| **[docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)** | **Packeta · Stripe/karta · SuperFaktúra · GoPay · DPD — tech handoff** |
| [docs/SUPERFAKTURA_SETUP.md](./docs/SUPERFAKTURA_SETUP.md) | SuperFaktúra inštalácia + API |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Deploy / env / smoke |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | IČO, DIČ, IBAN |
| [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) | Vývoj + freeze |
| [storefront/docs/WOO_CART.md](./storefront/docs/WOO_CART.md) | Košík |
| [storefront/docs/I18N.md](./storefront/docs/I18N.md) | CS/SK/EN/DE |
| [storefront/docs/DASHBOARD_AGENT.md](./storefront/docs/DASHBOARD_AGENT.md) | Dashboard AI agent (Woo) |
| [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md) | Lokálny WP |
| [AGENTS.md](./AGENTS.md) | Pravidlá pre AI |
| [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md) | Čo dorobiť (súhrn) |
| [reports/seo-taxonomy/FINAL_STATUS.md](./reports/seo-taxonomy/FINAL_STATUS.md) | SEO taxonomy status |

## Zakázané

- Secrets v gite  
- `DB_*` na Vercel  
- UI redesign bez zadania  
