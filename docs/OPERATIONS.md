# GrowMedica — operácie, endpointy, env

**Toto je hlavný prevádzkový súbor.**  
Stav / backlog: [../STATUS.md](../STATUS.md) · vývoj: [../storefront/docs/DEVELOPMENT.md](../storefront/docs/DEVELOPMENT.md)

---

## 1. Ako web funguje

```
Prehliadač
    │
    ├─ https://www.growmedica.cz     → Next.js na Vercel (UI + /api/*)
    │         │
    │         │ Woo REST (server-only kľúče)
    │         ▼
    └─ https://cms.growmedica.cz     → WordPress + WooCommerce
              produkty, sklad, objednávky, platby, doprava, e-maily
```

| Čo | Kde |
|----|-----|
| Katalóg, stránky, AI, košík UI | Next (`storefront/`) |
| Pokladňa / platba / doprava | CMS Woo (`/kontrola-objednavky`) |
| Admin produktov / objednávok | `cms…/wp-admin` |
| Firemné údaje | [vzorfirma.md](./vzorfirma.md) |

`CMS_PROVIDER=wordpress` na produkcii → dáta z Woo, nie zo Shopify.

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
| `/prihlasenie`, `/profil` | Účet (UI) |

**CMS (Woo) stránky:** `/kosik`, `/kontrola-objednavky`, `/moj-ucet`, VOP slugy na cms.

---

## 3. API endpointy (Next BFF)

Všetko pod `storefront/src/app/api/`.

### Katalóg / search

| Method | Path | Účel |
|--------|------|------|
| GET | `/api/products` | Zoznam produktov (Woo/Shopify podľa CMS) |
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
| GET | `/api/dashboard/orders` | Objednávky |
| GET | `/api/dashboard/inventory` | Sklad |
| POST | `/api/dashboard/agent` | AI agent |
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
| **`storefront/.env.local`** | lokálny dev | `CMS_PROVIDER`, Woo `ck_/cs_`, revalidate, Mistral, dashboard secret, Shopify rollback | **gitignored** |
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
NEXT_PUBLIC_DASHBOARD_URL=https://cms.growmedica.cz/wp-admin
DASHBOARD_AGENT_SECRET=...
MISTRAL_API_KEY=...                 # AI
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
| [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) | Deploy |
| **[MERCHANT_KEYS.md](./MERCHANT_KEYS.md)** | **Packeta · Stripe · SuperFaktúra · GoPay · DPD (ty)** |
| [vzorfirma.md](./vzorfirma.md) | IČO DIČ IBAN |
| [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) | SuperFaktúra Woo plugin + API |
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
| API credentials | ⏳ majiteľ **2a–2j** → potom full smoke + BACS proforma |
| Reinstall | `./scripts/install-superfaktura-cms.sh` |
| Docs | [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) · [reference/superfaktura-api-pattern.md](./reference/superfaktura-api-pattern.md) · majiteľ **2a–2k:** [../majitel.md](../majitel.md#2-superfaktúra--automatické-faktúry) |

---

*Aktualizované: 2026-07-17 (SF: infra smoke hotový, API čaká majiteľa)*
