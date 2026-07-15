# Poznámky — Shopify Admin token + Nexus (čo treba dokončiť)

Stručný checklist. **E-shop** ([growmedica.cz](https://www.growmedica.cz)) a **AI agent** na storefronte už bežia bez `shpat_` (tokenless Storefront API).  
**Admin token** (`shpat_…`) potrebuješ na: Nexus admin (iframe), zápis do Shopify, bundle skripty.

> **Pre AI agenta (automatizácia):** [poznamky-agent.md](./poznamky-agent.md) · `yarn shopify:admin-onboard --token shpat_...` · JSON runbook: [poznamky-agent.json](./poznamky-agent.json)

---

## Čo už funguje (nemusíš nič robiť)

| Čo | Ako |
|----|-----|
| Katalóg, košík, produkty | `SHOPIFY_STOREFRONT_TOKENLESS=1` na Vercel |
| Dashboard agent (Mistral) | [www.growmedica.cz/dashboard](https://www.growmedica.cz/dashboard) |
| Lokálny dev | `yarn dev` → [localhost:5555](http://localhost:5555) |

---

## Krok 1 — Zapni Admin API token v Shopify

### 1a) Otvor správny obchod

👉 [Shopify Admin — growmedica](https://admin.shopify.com/store/growmedica)

Over, že vľavo hore vidíš obchod **growmedica** (nie iný shop).

### 1b) Choď na Develop apps

**Hlavná cesta:**

👉 [Settings → Apps → Develop apps](https://admin.shopify.com/store/growmedica/settings/apps/development)

**Ak „Develop apps“ nevidíš:**

| Skús | Odkaz / postup |
|------|----------------|
| Cez Apps | [Settings → Apps and sales channels](https://admin.shopify.com/store/growmedica/settings/apps) → dole **Develop apps** |
| Povolenie vývoja app | [Settings → Apps](https://admin.shopify.com/store/growmedica/settings/apps) → **Allow custom app development** → zapni → ulož |
| Vyhľadávanie v Admin | Hore v Shopify vyhľadaj `Develop apps` alebo `Custom apps` |
| Iný účet | Musíš byť **store owner** alebo mať právo *Develop apps* — inak menu neuvidíš |

### 1c) Vytvor alebo otvor appku

1. **Create an app** → názov napr. `GrowMedica Nexus`
2. **Configure Admin API scopes** — zaškrtni aspoň:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory` (ak budeš meniť sklad)
3. **Save**
4. Záložka **API credentials** → **Install app** (alebo **Enable Admin API access**)
5. Skopíruj **Admin API access token** — začína na `shpat_`

> **Nikdy** nedávaj `shpat_` do poľa Storefront token — to sú dva rôzne tokeny.

### 1d) Over token (terminál)

**Odporúčané (automatizácia):**

```bash
cd storefront
yarn shopify:admin-onboard --token "shpat_..."     # uloží .env.local + Vercel, pri 403 exit 0 (partial)
yarn shopify:admin-verify                          # len overí token z .env.local
yarn shopify:admin-fix                             # otvorí Shopify Admin a čaká na Install app
```

**Manuálne (curl):**

```bash
cd storefront
# vlož token do .env.local ako SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
yarn shopify:admin-verify
```

| Výstup | Znamená |
|--------|---------|
| `OK: GrowMedica` (alebo názov shopu) | Token funguje → krok 2 |
| `403 API Access has been disabled` | App nie je nainštalovaná alebo je vypnutá → vráť sa na 1c, **Install app** |
| `401 Unauthorized` | Zlý / expirovaný token → vygeneruj nový v API credentials |
| `404` | Zlá doména → `SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com` |

**Alternatíva (curl):**

```bash
curl -sS -H "X-Shopify-Access-Token: shpat_TVOJ_TOKEN" \
  "https://growmedica.myshopify.com/admin/api/2025-01/shop.json" | head -c 300
```

---

## Krok 2 — Vlož token do Nexus (Lovable)

Nexus je **samostatná** appka — env sa nenastavuje v tomto repozitári.

### 2a) Otvor Nexus admin

👉 [growmedica-nexus.lovable.app/admin](https://growmedica-nexus.lovable.app/admin)

Prihlás sa (Firebase — e-mail musí byť v `ADMIN_EMAILS` na strane Nexus).

### 2b) Nájdi Shopify integráciu

**Hlavná cesta:** v admin UI sekcia **Integrations** / **Shopify** / **Nastavenia obchodu**.

**Ak to nevidíš:**

| Skús | Kde |
|------|-----|
| Lovable dashboard | [lovable.dev](https://lovable.dev) → projekt **growmedica-nexus** → **Settings → Environment variables** |
| Vercel (ak Nexus deployuješ tam) | [vercel.com](https://vercel.com) → projekt Nexus → **Settings → Environment Variables** |
| Priamo env názvy | Hľadaj polia `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_STORE_DOMAIN` |

### 2c) Vyplň polia

| Premenná | Hodnota |
|----------|---------|
| `SHOPIFY_STORE_DOMAIN` | `growmedica.myshopify.com` |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | `shpat_…` (z kroku 1) |
| `SHOPIFY_API_VERSION` | `2025-01` (voliteľné) |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | **prázdne** alebo Storefront token — **nie** `shpat_` |

Ulož → **Test pripojenia** v Nexus UI (ak tlačidlo existuje).

Detail env tabuľky: [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md#2-env-premenné-nexus)

---

## Krok 3 — Storefront (tento repozitár)

Token už môže byť v `.env.local` a na Vercel. Po **funkčnom** tokene z kroku 1d:

```bash
cd storefront
SHOPIFY_STOREFRONT_TOKENLESS=1 \
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_TVOJ_TOKEN \
./scripts/set-shopify-vercel-env.sh
```

Lokálne minimum v `.env.local`:

```bash
CMS_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com
SHOPIFY_STOREFRONT_TOKENLESS=1
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_API_VERSION=2025-01
```

Smoke testy:

```bash
yarn shopify:smoke
BASE_URL=http://localhost:5555 node scripts/mistral-agent-live-smoke.mjs
```

---

## Krok 4 — Ak iframe dashboard nefunguje

| Problém | Riešenie |
|---------|----------|
| Prázdny iframe / login | [Firebase Console](https://console.firebase.google.com/) → Authentication → Settings → **Authorized domains** → pridaj `growmedica.cz`, `www.growmedica.cz`, `growmedicanextjs.vercel.app`, `growmedica-nexus.lovable.app` |
| „Refused to frame“ | Na Nexus nastav `ALLOWED_FRAME_ANCESTORS` — pozri [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md#4-povolenie-iframe-embedu-frame-ancestors) |
| Agent v iframe, ale Shopify nie | Nexus nemá platný `shpat_` → krok 2 |
| Agent OK, katalóg prázdny | Storefront — over [www.growmedica.cz/api/products](https://www.growmedica.cz/api/products) |

---

## Rýchla mapa tokenov

| Token | Prefix | Kam | Na čo |
|-------|--------|-----|-------|
| Storefront | **nie** `shpat_` | Vercel / `.env.local` | E-shop, agent číta katalóg |
| Tokenless | (žiadny) | `SHOPIFY_STOREFRONT_TOKENLESS=1` | growmedica.myshopify.com — už nasadené |
| Admin | `shpat_` | Nexus + `.env.local` + Vercel | Zápis produktov, Nexus admin, skripty |

---

## Užitočné odkazy

- [Shopify — Develop apps (growmedica)](https://admin.shopify.com/store/growmedica/settings/apps/development)
- [Shopify — všetky produkty](https://admin.shopify.com/store/growmedica/products)
- [Storefront produkcia](https://www.growmedica.cz/produkty)
- [Dashboard produkcia](https://www.growmedica.cz/dashboard)
- [Nexus admin](https://growmedica-nexus.lovable.app/admin)
- [Shopify live doc v repozitári](./SHOPIFY_LIVE.md)

---

## Bezpečnosť

- `shpat_` **nikdy** do gitu, **nikdy** do `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- Token v chate / screenshote → po aktivácii **rotuj** (revoke + nový) v Shopify Admin
- `.env.local` drž lokálne (`chmod 600`)