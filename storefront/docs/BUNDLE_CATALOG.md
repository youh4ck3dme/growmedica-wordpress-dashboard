# Balíčky zdravia — katalóg a Shopify setup

Katalóg **63 balíčkov** je v kóde: [`src/lib/bundles/catalog.ts`](../src/lib/bundles/catalog.ts).

## Shopify Admin — vytvorenie balíčkov (TOP 10)

Potrebujete **Admin API token** (`shpat_...`) s právom `write_products`.  
**Nikdy** ho necommitujte ani nedávajte do Vercel Preview env pre frontend.

### 1) Vytvorenie tokenu

```
Shopify Admin → Settings → Apps and sales channels → Develop apps
→ Create app → Configure Admin API scopes: read_products, write_products
→ Install app → Reveal Admin API access token
```

Do `storefront/.env.local`:

```env
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
```

### 2) Spustenie skriptu

```bash
cd storefront
yarn bundles:create:dry    # náhľad cien
yarn bundles:create        # vytvorí 10 produktov
```

Skript: [`scripts/create-shopify-bundles.mjs`](../scripts/create-shopify-bundles.mjs)

- handle: `balicek-{slug}`
- tag: `balicek-zdravia`
- compare-at: odhad 14,90 € × počet položiek
- price: compare-at − zľava z katalógu

Po vytvorení upravte ceny podľa reálnych SKU v Admin.

### 3) Overenie na webe

- `/balicky` — prvých 10 kariet má **cenu** a tlačidlo **Pridať do košíka**
- Webhooky aktualizujú cache; prípadne redeploy

---

1. **Products → Add product** pre každý balíček (odporúčame rollout: 10 → 30 → 63).
2. **Title:** `Balíček: {názov z katalógu}` (napr. `Balíček: Imunitný Štít Basic`).
3. **Handle:** `balicek-{slug}` — slug nájdete v `catalog.ts` (napr. `balicek-imunitny-stit-basic`).
4. **Tags:** `balicek-zdravia` + kategória (napr. `Imunita`).
5. **Pricing:**
   - **Compare at price** = súčet cien jednotlivých produktov.
   - **Price** = compare at price × (1 − zľava % z katalógu).
6. **Description:** zoznam položiek z poľa `items` v katalógu.
7. **Collections → Create collection** „Balíčky zdravia“ — podmienka: tag `balicek-zdravia`.
8. **QA:** pridať do košíka → checkout → cena sedí so zľavou.

## Zľavová matica

| Veľkosť (`size`) | Počet položiek | Typická zľava |
|-------------------|----------------|---------------|
| mini | 2 | 10 % |
| standard | 3 | 12 % |
| plus | 4–5 | 15 % |
| premium | 5+ | 18–20 % |

## Web

| URL | Popis |
|-----|--------|
| `/balicky` | Všetkých 63 balíčkov (grid) |
| `/kolekcie/balicky-zdravia` | 301 redirect → `/balicky` |
| Homepage | Sekcia „Prečo GrowMedica“ + 6 featured balíčkov |

Keď existuje Shopify produkt s handle `balicek-{slug}`, karta zobrazí cenu a odkaz na PDP.

## Shopify Bundles app (voliteľné)

Pre skladové väzby nainštalujte **Shopify Bundles** a prepojte komponenty balíčka. Inak stačí jeden „virtuálny“ produkt s popisom obsahu.

## Compliance

- Balíček **Tehotenstvo prep** (`balicek-tehotenstvo-prep`) — len s disclaimerom, odporúčame konzultáciu s lekárom.
- Tvrdenia formulujte ako **podporu**, nie liečbu (rovnako ako chatbot).

## Kompletný zoznam 63 balíčkov

Pozri `HEALTH_BUNDLE_CATALOG` v [`catalog.ts`](../src/lib/bundles/catalog.ts) — jediný zdroj pravdy pre názvy, slugy, zloženie a zľavy.
