# Blueprint: Shopify → WooCommerce (cms.growmedica.cz)

**Stav env (2026-07-16):** Woo REST + App Password overené, kľúče v `wordpress-production.local.env` + `storefront/.env.local`.  
**Live shop:** ostáva **Shopify** (`CMS_PROVIDER=shopify`). WP = zrkadlo / budúci headless, nie cutover.

---

## 0. Cieľ a pravidlá

| Pravidlo | |
|----------|--|
| Master katalógu (zákazník) | **Shopify** + Next.js na www |
| Cieľ importu | Woo produkty/kategórie na **cms.growmedica.cz** |
| Cutover shopu na WP | **NIE** v tejto fáze (žiadna zmena `CMS_PROVIDER` na Production) |
| Zákazníci Shopify → Woo | **mimo scope** fázy 1 (len produkty + kategórie) |
| Secrets | len gitignored env; nikdy do gitu / Vercel `DB_*` |

---

## 1. Predpoklady (DONE / TODO)

| # | Položka | Stav |
|---|---------|------|
| 1.1 | DNS + SSL `cms.growmedica.cz` | ✅ |
| 1.2 | WP admin `info@growmedica.cz` | ✅ |
| 1.3 | WooCommerce nainštalované (~10.9) | ✅ (REST system_status OK) |
| 1.4 | Woo REST keys `ck_` / `cs_` Read/Write | ✅ v env |
| 1.5 | Application Password | ✅ v env |
| 1.6 | Shopify Admin client credentials | ✅ storefront `.env.local` |
| 1.7 | Env súbory naplnené | ✅ |
| 1.8 | Permalinks `/produkt/%postname%/` | ✅ |
| 1.9 | Mu-plugins cors + revalidate | ✅ na hostingu |
| 1.10 | Import skript Shopify→Woo | ✅ `scripts/import-shopify-to-woo.mjs` |
| 1.11 | Dry-run 5 produktov | ✅ PASS (energy-renol … energy-stimaral) |
| 1.12 | Full import ~460 | ⬜ |
| 1.13 | (Neskôr) Vercel `CMS_PROVIDER=wordpress` | ⬜ len po cutover schválení |

---

## 2. Architektúra importu

```
┌─────────────────────┐     Admin API      ┌──────────────────────┐
│ Shopify             │  client_credentials│ Import skript        │
│ growmedica.myshopify│ ─────────────────►│ (Node, storefront/   │
│ ~460 products       │   GraphQL/REST     │  scripts/)           │
└─────────────────────┘                    └──────────┬───────────┘
                                                      │ Woo REST v3
                                                      │ ck_ + cs_
                                                      ▼
                                           ┌──────────────────────┐
                                           │ WordPress + Woo      │
                                           │ cms.growmedica.cz    │
                                           └──────────────────────┘

Browser zákazník ──► www.growmedica.cz (Next.js) ──► Shopify (nezmenené)
```

### Mapovanie polí (základ)

| Shopify | WooCommerce |
|---------|-------------|
| `handle` | `slug` |
| `title` | `name` |
| `body_html` / description | `description` / `short_description` |
| `status` ACTIVE | `status` publish |
| `variants[].price` | `regular_price` (simple) / variations |
| `variants[].sku` | `sku` |
| `variants[].inventory_quantity` | `stock_quantity` + manage_stock |
| `images[]` | `images[{src}]` (URL z CDN — Woo stiahne) |
| `productType` / tags | `categories` / `tags` |
| `vendor` | meta `_shopify_vendor` alebo attribute |
| Shopify GID / id | meta `_shopify_product_id` (idempotencia) |

**Idempotencia:** pred create hľadaj produkt podľa meta `_shopify_product_id` alebo `sku` / `slug` → update namiesto duplicity.

---

## 3. Env — kde čo je

### A) `wordpress-production.local.env` (gitignored, root repa)

- `DB_*` — len hosting  
- `WORDPRESS_BASE_URL`  
- `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET`  
- `WORDPRESS_APP_PASSWORD`  
- `WORDPRESS_REVALIDATION_SECRET`  

### B) `storefront/.env.local` (gitignored)

```bash
CMS_PROVIDER=shopify                    # OSTÁVA shopify
SHOPIFY_*                               # existujúce
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WORDPRESS_REVALIDATION_SECRET=...
# WOO_MOCK_MODE=0
```

### C) Vercel Production

- **Teraz:** nič meniť na wordpress cutover  
- Woo keys na Vercel **až** keď `CMS_PROVIDER=wordpress`  
- **Nikdy** `DB_*`

### D) Overenie env (pred importom)

```bash
cd storefront
# Woo
curl -s -u "$WOO_CONSUMER_KEY:$WOO_CONSUMER_SECRET" \
  "https://cms.growmedica.cz/wp-json/wc/v3/products?per_page=1" | head -c 200
# Shopify Admin
yarn shopify:admin-verify --json
```

---

## 4. Fázy práce (poradie)

### Fáza A — stabilizácia CMS (pred dátami)

1. WP Admin → WooCommerce setup (krajina SK, mena EUR) ak wizard nedokončený  
2. Permalinks: `/produkt/%postname%/` + flush  
3. Nahrať mu-plugins: `growmedica-cors.php`, `growmedica-revalidate.php`  
4. Na hostingu env pre revalidate: `GROWMEDICA_STOREFRONT_URL`, `GROWMEDICA_REVALIDATION_SECRET`  
5. Smoke: `yarn woo:smoke` proti `https://cms.growmedica.cz` (s env)

### Fáza B — skript importu

Nový skript (návrh cesty):

`storefront/scripts/import-shopify-to-woo.mjs`

Schopnosti:

| Flag | Význam |
|------|--------|
| `--dry-run` | len log, žiadny zápis |
| `--limit=N` | max N produktov |
| `--handle=slug` | jeden produkt |
| `--skip-images` | rýchlejší test |
| `--update` | update existujúcich podľa meta |

Závislosti: existujúci `shopify-admin-client.mjs` + tenký Woo client (už `woo-admin-client.mjs` ak existuje).

### Fáza C — dry-run a pilot

1. `--dry-run --limit=5` → skontrolovať mapovanie  
2. `--limit=5` (write) → 5 produktov v WP admin  
3. Manuálna kontrola: obrázok, cena EUR, slug, sklad  
4. Oprava edge cases (varianty, bundle tagy)

### Fáza D — full import

1. `--update` full katalóg  
2. Report: created / updated / failed  
3. `GET /wc/v3/products?per_page=1` + count  
4. Porovnanie count Shopify vs Woo (± known skips)

### Fáza E — (voliteľné neskôr) cutover shopu

Len po písomnom schválení:

1. Vercel: `CMS_PROVIDER=wordpress` + Woo keys  
2. Smoke www proti Woo  
3. Rollback plán: späť `CMS_PROVIDER=shopify`

---

## 5. Riziká

| Riziko | Mitigácia |
|--------|-----------|
| Duplicitné produkty | meta `_shopify_product_id` |
| Varianty (size/flavor) | Woo variable products; fáza 1 môže flatten na simple ak 1 variant |
| Veľké obrázky / timeout | batch + retry; `--skip-images` pilot |
| Rate limits Shopify/Woo | sleep medzi requestami |
| Dual edit Shopify+Woo | master = Shopify; re-import prepisuje Woo |
| App Password / keys v chate | rotácia po projekte |

---

## 6. Definition of Done (fáza import)

- [ ] Env smoke Woo + Shopify PASS  
- [ ] Skript v repo + docs  
- [ ] Dry-run OK  
- [ ] ≥ 95 % produktov zo Shopify v Woo (alebo zdôvodnené skip)  
- [ ] www stále Shopify  
- [ ] Žiadne secrets v gite  

---

## 7. Ďalší krok po schválení tohto blueprintu

```text
1) Overiť permalinky + Woo wizard na cms
2) Mu-plugins
3) Implementovať import-shopify-to-woo.mjs
4) --dry-run --limit=5 → --limit=5 write → full
```

**Nepokračovať na full import bez dry-run PASS.**
