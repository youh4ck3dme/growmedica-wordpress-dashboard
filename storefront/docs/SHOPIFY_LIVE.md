# Shopify live katalóg (growmedica.myshopify.com)

Live sklad produktov pre storefront cez **Shopify Storefront API** (GraphQL). Verejný katalóg: [growmedica.myshopify.com/collections/all](https://growmedica.myshopify.com/collections/all).

WordPress produkcia (`cms.growmedica.cz`) je **odložená** — katalóg ide priamo zo Shopify.

## Architektúra

| Vrstva | Zdroj |
|--------|--------|
| Storefront `/produkty`, `/kosik` | `CMS_PROVIDER=shopify` → `src/lib/shopify/*` |
| Dashboard agent tools | `catalog/*` (automaticky Shopify) |
| Nexus admin iframe | Shopify Admin API (`shpat_`) + voliteľne Storefront token |

## Tokeny — kritické

| Token | Prefix | Kde |
|-------|--------|-----|
| **Storefront API** | nie `shpat_` | Vercel `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `.env.local` |
| **Admin API** | `shpat_` | Nexus `SHOPIFY_ADMIN_ACCESS_TOKEN`, lokálne skripty |

**Ako získať Storefront token:**
Shopify Admin → Settings → Apps → Develop apps → Create app → Configure **Storefront API** scopes → Install → skopíruj **Storefront API access token**.

Odporúčané scopes: `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`.

**Tokenless / minimálny token:** product detail **nežiada** `quantityAvailable` ani `metafields` — tieto polia vyžadujú `unauthenticated_read_product_inventory` resp. `unauthenticated_read_metafields`. Bez nich Shopify vráti `ACCESS_DENIED` a starší client by vyhodil 500 na `/produkty/[handle]`. Zobrazenie zostatku skladu a zloženia z metafieldov zapni až po pridaní týchto scopes.

## S1 — Lokálny smoke

```bash
cd storefront
yarn setup:env          # interaktívne — growmedica.myshopify.com + Storefront token
yarn shopify:smoke      # Storefront API test
yarn dev                # http://localhost:5555
curl -s http://localhost:5555/api/products | head -c 500
```

`.env.local` minimum:

```bash
CMS_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<storefront-token>
SHOPIFY_REVALIDATION_SECRET=<min-16-znakov>
SHOPIFY_API_VERSION=2025-01
NEXT_PUBLIC_SITE_URL=http://localhost:5555
```

## S2 — Vercel produkcia

```bash
cd storefront
SHOPIFY_STOREFRONT_ACCESS_TOKEN=... \
SHOPIFY_REVALIDATION_SECRET=... \
./scripts/set-shopify-vercel-env.sh

# alebo s deployom:
./scripts/set-shopify-vercel-env.sh --deploy
```

Kritické env:

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `shopify` |
| `SHOPIFY_STORE_DOMAIN` | `growmedica.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront token |
| `SHOPIFY_REVALIDATION_SECRET` | min. 16 znakov |
| `NEXT_PUBLIC_SITE_URL` | `https://www.growmedica.cz` |
| `SHOPIFY_MOCK_MODE` | **odstrániť** z Vercel |

Yarn alias: `yarn vercel:shopify-env`

## S3 — Nexus admin (Lovable)

V **growmedica-nexus.lovable.app** → Shopify integrácia:

| Pole | Hodnota |
|------|---------|
| Store domain | `growmedica.myshopify.com` |
| API verzia | `2025-01` |
| Admin access token | `shpat_…` |
| Storefront access token | Storefront token (voliteľné pre test pripojenia) |

Po uložení spusti **test pripojenia** v Nexus UI.

Referencia: [DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)

## S4 — Kategórie

Navigácia mapuje kategórie cez [`category-map.ts`](../src/lib/category-map.ts) (productType + tags). Shopify collection handles sa používajú ako bonus metadata.

**Audit growmedica.myshopify.com (júl 2026):**
- 460+ produktov, 0 nav collection handles (OK — mapovanie cez productType)
- Pokrytie: vitaminy-mineraly 112, specialna-vyziva 133, krasa-pokozka 66, regeneracia 64, zdrave-potraviny 57
- Prázdne kategórie (tag-only rules): sportova-vyziva, klby-pohyb, travenie, srdce-cievy, aminokyseliny — doplniť tagy v Shopify Admin ak treba

Audit:

```bash
yarn shopify:collections-audit
```

## S5 — Dashboard agent

Pri `CMS_PROVIDER=shopify` agent automaticky číta live katalóg:

```bash
CMS_PROVIDER=shopify yarn dev
# /dashboard → „Zobraz produkty“, „Súhrn katalógu“
```

## S6 — Production smoke

```bash
yarn type-check
yarn build
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
```

## Rollback na WordPress mock

Vercel:

```
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
```

Redeploy.

## Súvisiace skripty

| Skript | Účel |
|--------|------|
| `scripts/shopify-smoke-test.mjs` | Storefront API smoke |
| `scripts/shopify-collections-audit.mjs` | category-map vs collections |
| `scripts/set-shopify-vercel-env.sh` | Vercel env sync |
| `scripts/setup-env.sh` | Lokálne `.env.local` |
