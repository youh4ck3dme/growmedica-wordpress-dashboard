# GrowMedica — operácie, endpointy, env

**Toto je hlavný prevádzkový súbor.**  
**AI backlog:** [../README.md § AI AGENT](../README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29)  
Stav / backlog: [../STATUS.md](../STATUS.md) · vývoj: [../storefront/docs/DEVELOPMENT.md](../storefront/docs/DEVELOPMENT.md)

> **Poznámka 2026-07-29:** `/prihlasenie` a `/profil` sú stále **MOCK** (localStorage). Checkout ide na CMS. Analytics (GTM/GA4) ešte nie sú zapojené.

---

## 1. Ako web funguje

```
Prehliadač
    │
    ├─ https://www.growmedica.cz     → Next.js storefront (Vercel)
    ├─ https://growmedica.store      → Amber theme storefront (Vercel kadadakaj-dev)
    │         │
    │         │ Woo REST (server-only ck_/cs_)
    │         ▼
    └─ https://cms.growmedica.cz     → WordPress + WooCommerce
              produkty, sklad, objednávky, platby, doprava, e-maily
```

| Čo | Kde |
|----|-----|
| Katalóg / UI (.cz) | Next `storefront/` — Vercel project `growmedica-wordpress-dashboard` (h4ck3d) / `growmedica-woo-storefront` (kadadakaj-dev) |
| Katalóg / UI (.store) | Amber — Vercel `growmedica-store-amber` (team `kds-projects-cb8807c0` / kadadakaj-dev) → https://growmedica-store-amber.vercel.app |
| Pokladňa / platba / doprava | CMS Woo (`/kontrola-objednavky`) |
| Admin produktov / objednávok | `cms…/wp-admin` |
| Firemné údaje | [vzorfirma.md](./vzorfirma.md) |

**Jeden CMS:** oba weby ťahajú katalóg z `WORDPRESS_BASE_URL=https://cms.growmedica.cz` + `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET`. Shopify runtime v storefronte nie je.

**CORS (Store API z browsera):** `wordpress/mu-plugins/growmedica-cors.php` — allowlist obsahuje `growmedica.cz`, `www`, `growmedica.store`, `www.growmedica.store`, Amber preview URL.

---

## 2. Verejné stránky (Next)

| URL | Účel |
|-----|------|
| `/` | Homepage |
| `/produkty`, `/produkty/[handle]` | Katalóg, detail |
| `/kolekcie`, `/kolekcie/[handle]` | Kategórie |
| `/kosik` | Košík (BFF cookie) → checkout na cms |
| `/vyhladavanie` | Search |
| `/balicky` | Balíčky |
| `/kontakt` | Kontakt + firma |
| `/doprava-a-platba` | Doprava / platba |
| `/obchodne-podmienky`, `/ochrana-osobnych-udajov`, `/reklamacny-poriadok` | Legal |
| `/o-nas`, `/faq`, `/blog`, `/velkoobchod` | Obsah |
| `/dashboard` | Admin (secret + agent) |
| `/prihlasenie`, `/profil` | Účet — ⚠️ **MOCK** (P0: reálna Woo auth) |
| `/oblubene` | Wishlist — localStorage only |

**CMS (Woo) stránky:** `/kosik`, `/kontrola-objednavky`, `/moj-ucet`, VOP slugy na cms.

---

## 3. API endpointy (Next BFF)

Všetko pod `storefront/src/app/api/`.

### Katalóg / search

| Method | Path | Účel |
|--------|------|------|
| GET | `/api/products` | Zoznam produktov (WooCommerce) |
| GET | `/api/search` | Vyhľadávanie |

### Košík (WordPress režim)

| Method | Path | Účel |
|--------|------|------|
| GET | `/api/cart` | Stav košíka |
| POST | `/api/cart/add` | Pridať položku |
| POST/PATCH | `/api/cart` | Update / clear (podľa route) |
| POST | `/api/cart/discount` | Kupón |

Cookie session (nie browser localStorage ako SoT). Detail: [../storefront/docs/WOO_CART.md](../storefront/docs/WOO_CART.md).

### Cache

| Method | Path | Účel |
|--------|------|------|
| POST | `/api/revalidate?secret=…&tag=…` | ISR po zmene produktu na cms |

### AI

| Method | Path | Účel |
|--------|------|------|
| POST | `/api/assistant/chat` | Chat asistent |
| POST | `/api/ai/recommend` | Odporúčania (SupplementFinder) |
| POST | `/api/ai/product-fit` | Fit produktu |
| POST | `/api/ai/compliance-check` | Compliance text |

### Dashboard (vyžaduje `DASHBOARD_AGENT_SECRET` / session)

| Method | Path | Účel |
|--------|------|------|
| POST | `/api/dashboard/session` | Prihlásenie session |
| GET | `/api/dashboard/health` | Health |
| GET | `/api/dashboard/overview` | Prehľad |
| GET | `/api/dashboard/products` | Produkty |
| GET/PATCH | `/api/dashboard/products/[handle]` | Detail / úprava |
| POST | `/api/dashboard/products/[handle]/revalidate` | Revalidate |
| GET | `/api/dashboard/orders` | Objednávky (Woo) |
| GET/PUT | `/api/dashboard/inventory` | Sklad (Woo; PUT s live writes) |
| POST | `/api/dashboard/agent` | AI agent (Woo tools; pozri DASHBOARD_AGENT.md) |
| GET | `/api/dashboard/audit` | Audit log |
| GET | `/api/dashboard/export/[id]` | Export |

---

## 4. Woo / CMS API (nie Next)

| API | URL base | Auth |
|-----|----------|------|
| Woo REST v3 | `https://cms.growmedica.cz/wp-json/wc/v3/…` | `ck_` + `cs_` |
| WP REST | `…/wp-json/wp/v2/…` | Application Password (skripty) |
| Checkout | `https://cms.growmedica.cz/kontrola-objednavky/` | session zákazníka |

**Nikdy** MySQL `DB_*` v Next ani na Vercel — len na hostingu WP.

---

## 5. Env — kde čo je

### ❌ Nie je všetko v jednom `.env.local`

| Súbor | Kde | Čo obsahuje | Git |
|-------|-----|-------------|-----|
| **`storefront/.env.local`** | lokálny dev | `CMS_PROVIDER`, Woo `ck_/cs_`, revalidate, Mistral, dashboard secret | **gitignored** |
| **`storefront/.env.example`** | šablóna | rovnaké kľúče **bez** hesiel | v gite |
| **`wordpress-production.local.env`** | koreň repa | DB, App Password, SMTP, Woo keys (prevádzka cms) | **gitignored** |
| **Vercel Project → Env** | cloud | produkčné Next env (nie DB, nie SMTP cms) | mimo gitu |
| **CMS / Code Snippets / FluentSMTP** | cms admin | SMTP heslo, ISR secret options | mimo gitu |

### Minimálne pre Next (produkcia / `.env.local` pri live Woo)

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...   # rovnaký ako na cms
NEXT_PUBLIC_SITE_URL=https://www.growmedica.cz
NEXT_PUBLIC_DASHBOARD_MODE=agentic
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin
DASHBOARD_AGENT_SECRET=...
DASHBOARD_ALLOW_LIVE_WRITES=1       # len ak chceš agent zápisy do Woo
MISTRAL_API_KEY=...                 # AI
```

**Dashboard smoke (produkcia):**

```bash
curl -s -H "x-dashboard-agent-secret: $DASHBOARD_AGENT_SECRET" \
  https://www.growmedica.cz/api/dashboard/health
# očakávaj: cms_provider=wordpress, catalog=live, admin=wordpress

curl -s -X POST https://www.growmedica.cz/api/dashboard/agent \
  -H "Content-Type: application/json" \
  -H "x-dashboard-agent-secret: $DASHBOARD_AGENT_SECRET" \
  -d '{"command":"Zobraz posledných 5 objednávok"}'
# očakávaj: list_orders status ok
```


### Len v `wordpress-production.local.env` (cms hosting)

```bash
DB_*                    # len wp-config na WebSupport
WORDPRESS_APP_PASSWORD
SMTP_HOST / USER / PASS
GROWMEDICA_STOREFRONT_URL
GROWMEDICA_REVALIDATION_SECRET
```

Šablóna zoznamu: [../storefront/.env.example](../storefront/.env.example)  
Deploy checklist: [../PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md)

### GeoIP block (Singapur / SG)

Na Vercel storefronte voliteľne blokuj krajiny cez middleware (`x-vercel-ip-country`):

```bash
GEO_BLOCK_ENABLED=1
GEO_BLOCK_COUNTRIES=SG
```

Detail: [../storefront/docs/GEO_BLOCK.md](../storefront/docs/GEO_BLOCK.md)

---

## 6. Ako sa o web starať

### Denne / po zmene produktu

1. Edit v **cms** → produkt uložiť (ISR snippet volá revalidate).  
2. Ak stránka „stará“:  
   `POST /api/revalidate?secret=…&tag=woo-products`  
3. Objednávky: Woo → Objednávky; e-maily cez SMTP.

### Po deployi Next

```bash
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
```

### Zmena firmy / IBAN

1. [vzorfirma.md](./vzorfirma.md)  
2. `storefront/src/lib/company.ts`  
3. Woo adresa / BACS / e-mail footer  
4. Deploy Next  

### Zmena env na produkcii

1. Vercel → Environment Variables  
2. Redeploy  
3. **Nemeň** DB na Vercel  

### Incidenty

| Problém | Kam |
|---------|-----|
| Katalóg prázdny / 500 | Vercel logs + `WOO_*` env + cms up |
| Košík prázdny medzi requestami | cookie cart, `/api/cart` |
| Checkout 404 | cms stránky Woo (pokladňa) |
| E-mail nejde | FluentSMTP / snippet na cms, nie Vercel |
| Staré dáta na stránke | revalidate / ISR secret |

Diagnostika: [../storefront/docs/DIAGNOSTICS.md](../storefront/docs/DIAGNOSTICS.md)

### Testy (e2e + integrity)

| | |
|--|--|
| Priečinok | `storefront/tests/` |
| README | [../storefront/tests/README.md](../storefront/tests/README.md) |
| Prompt | [PROMPT_TESTS.md](./PROMPT_TESTS.md) |
| Live nákup | `cd storefront && yarn test:e2e:live` |
| Woo integrity | `cd storefront && yarn test:woo:integrity` |

---

## 7. Mapa dokumentácie

| Súbor | Účel |
|-------|------|
| **Tento súbor `docs/OPERATIONS.md`** | Endpointy + env + prevádzka |
| [STATUS.md](../STATUS.md) | Čo je hotové / čo robiť |
| [TODO.md](../TODO.md) | Checklist |
| [CO_DOROBIT.md](../reports/CO_DOROBIT.md) | Súhrn nedokončených vecí |
| [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) | Deploy |
| **[MERCHANT_KEYS.md](./MERCHANT_KEYS.md)** | **Packeta · Stripe · SuperFaktúra · GoPay · DPD (ty)** |
| [vzorfirma.md](./vzorfirma.md) | IČO DIČ IBAN |
| [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) | SuperFaktúra Woo plugin + API |
| **[FIREBASE_CLI.md](./FIREBASE_CLI.md)** | **Nexus Google Sign-In — firebase/gcloud Auth ops** |
| [storefront/docs/DEVELOPMENT.md](../storefront/docs/DEVELOPMENT.md) | Vývoj + freeze |
| [storefront/docs/WOO_CART.md](../storefront/docs/WOO_CART.md) | Košík |
| [storefront/docs/WP_WEBHOOKS.md](../storefront/docs/WP_WEBHOOKS.md) | Revalidate |
| [storefront/.env.example](../storefront/.env.example) | Zoznam env kľúčov |

### SuperFaktúra (fakturácia)

| | |
|--|--|
| Plugin | `woocommerce-superfaktura` 1.53.2 na cms (active) |
| Defaults | Code Snippet BACS/COD · `defaults_applied: true` |
| Admin | `cms…/wp-admin/admin.php?page=wc-settings&tab=superfaktura` |
| Status API | `GET /wp-json/growmedica/v1/sf-status` (App Password) |
| Smoke 30× | `./scripts/smoke-superfaktura-30.sh` (full) · `ALLOW_WITHOUT_API=1` (infra ✅ 30/30) |
| API credentials | ⏳ majiteľ **2a–2j** → `set-superfaktura-api-from-env.sh` alebo Woo tab → potom `smoke-superfaktura-30.sh` + `smoke-superfaktura-bacs-order.sh` |
| Go-live verify | [SUPERFAKTURA_GO_LIVE_VERIFY.md](../reports/SUPERFAKTURA_GO_LIVE_VERIFY.md) |
| Reinstall | `./scripts/install-superfaktura-cms.sh` |
| Docs | [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) · [reference/superfaktura-api-pattern.md](./reference/superfaktura-api-pattern.md) · majiteľ **2a–2k:** [../majitel.md](../majitel.md#2-superfaktúra--automatické-faktúry) |

### Firebase Auth (Nexus Google Sign-In)

| | |
|--|--|
| Project | `noorgrowmfinnal-58800798-76fac` |
| CLI docs | [FIREBASE_CLI.md](./FIREBASE_CLI.md) |
| Status | `./scripts/firebase/status.sh` |
| Domains | `./scripts/firebase/ensure-auth-domains.sh` |
| Google IdP | `./scripts/firebase/ensure-google-provider.sh` |
| Local tools | `.tools/` (gitignored) — firebase-tools, gcloud ADC, Temurin 21 |

---

*Aktualizované: 2026-07-18 (Firebase CLI Auth ops + SF)*
