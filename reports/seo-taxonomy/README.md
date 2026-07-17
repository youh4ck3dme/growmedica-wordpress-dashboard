# GrowMedica SEO Taxonomy (pavúk)

| | |
|---|---|
| **Schema** | `1.1.0` (**frozen** 2026-07-17) |
| **Generated** | `2026-07-16T23:55:34.558Z` |
| **Source host** | `https://growmedica.sk` (680 URL) |
| **Live catalog** | `https://www.growmedica.cz/api/products` (460) |

## Súbory

| Súbor | Účel |
|-------|------|
| `growmedica-seo-taxonomy.xlsx` | 10 listov (Overview … QA) |
| `growmedica-seo-menu-tree.json` | Strojový strom + **`wooImportProducts`** |

**Scope:** len `reports/seo-taxonomy/`. Storefront, importer ani WooCommerce runtime **neboli** zmenené týmto reportom.

---

## Freeze policy (oficiálny import set)

Táto verzia `1.1.0` je **zdroj pravdy** pre ďalší Woo import.

| Pravidlo | Hodnota |
|----------|---------|
| Import entrypoint | **iba** `wooImportProducts[]` |
| Povolené na import | `importStatus === "READY"` → **459** |
| Zakázané na import | `importStatus === "HOLD"` → **1** (nikdy neimportovať, kým sa status nezmení v novom schema bumph) |
| Kategórie | hierarchicky z `categories[]` (`parentId` / path), **nie** flat Shopify `productType` |
| Many-to-one | schválené: viac starých source URL/ID → **1** live handle; staré URL idú do `redirects[]` |
| Redirecty | 663× 301, unique `sourceUrl`, bez slučiek — deploy **až po** potvrdení Woo/storefront slugov |
| SEO copy / INDEX | draft — editorial/medical pred publikáciou do indexu |

### HOLD (uzavreté rozhodnutie)

| Handle | Status | Dôvod |
|--------|--------|--------|
| `bio-polyporus-prasok-100g-odvodhuje-organizmus` | **HOLD** | `invalid_live_product_type_and_missing_category_tags` — `productType=Product`, generické tagy, prázdna kategória |

**Rozhodnutie 2026-07-17:** nechať **HOLD**. Nie je v oficiálnom import sete.  
Oficiálny Woo import set = **459 READY**.

### Many-to-one (schválené merge do 1 Woo/live handle)

Príklady v `wooImportProducts` (viac `sourceProductIds` / `sourceUrls`):

- ALPA Francovka varianty → jeden handle (objemové/zdrojové riadky zlúčené)
- Calivita Vitamin C 1000 mg plus → jeden handle

`catalogAudit.mergedVariantSourceRows = 9` (source rows), allowlist po dedupe = 460 live.

---

## Overené počty (freeze QA)

| Check | Actual |
|-------|--------|
| Source URLs | 680 |
| Explicit categories | 199 |
| Inferred ancestors | 14 |
| Categories total | 213 |
| Source products (legacy) | 464 |
| Live catalog / `wooImportProducts` | 460 |
| READY / HOLD | **459 / 1** |
| Redirects (301) | 663, 0 duplicate sources, 0 loops |
| Orphan products / parents | 0 |
| Unapproved live-handle collisions | 0 |
| Excel sheets | 10 |
| QA sheet | all count checks **PASS** |

---

## Čo ešte NIE je uzavreté (mimo freeze)

| Položka | Count | Blokuje import kódu? |
|---------|------:|----------------------|
| `medical_context_review` na produktoch | 17 | Nie (import READY môže ísť; copy review osobitne) |
| SEO `EDITORIAL REVIEW` | 68 riadkov | Nie |
| INDEX / THIN / HIDDEN policy | 33 / 30 / 150 | Nie (publish neskôr) |
| Importer číta `wooImportProducts` | — | **Áno pre live import** — najprv upraviť skript + `--dry-run` |

---

## Next steps (poradie)

1. ~~Freeze reportu + HOLD rozhodnutie~~ **DONE (táto verzia)**  
2. Upraviť `storefront/scripts/import-shopify-to-woo.mjs`:
   - source = `wooImportProducts` READY only  
   - hierarchical categories z `categories`  
   - **iba** `--dry-run` (5 → 50 → full)  
3. Live Woo import až po green dry-run  
4. Deploy 663 redirectov  
5. Menu / INDEX / medical SEO publish  

## Rollback

Zmazať alebo revertnúť `reports/seo-taxonomy/`. Ostatné súbory projektu nedotknuté.

## Changelog

| Verzia | Dátum | Zmena |
|--------|-------|--------|
| `1.0.0` | 2026-07-16 | Prvý pavúk (199+14 cats, 464 products, 663 redirects) |
| `1.1.0` | 2026-07-16/17 | Live catalog match, `wooImportProducts` 459 READY + 1 HOLD, manual reviews closed, freeze policy |

## Dry-run helper (CMS)

```bash
./scripts/run-taxonomy-dry-run.sh
```

Uses `wordpress-production.local.env` Woo keys + `https://cms.growmedica.cz`.  
Do **not** only override `WORDPRESS_BASE_URL` while keeping localhost keys from `.env.local` (→ 401).
