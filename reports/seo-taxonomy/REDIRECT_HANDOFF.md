# Redirect handoff (after green Woo post-check)

## Woo taxonomy — GREEN (do not re-debug)

Latest `IMPORT_SHOPIFY_TO_WOO_REPORT.json` (post-check dry-run):

| Invariant | Expected | Actual |
|-----------|----------|--------|
| categoriesExisting | 75 | **75** |
| categoriesWouldCreate | 0 | **0** |
| productsUnchanged | 459 | **459** |
| productsWouldUpdate | 0 | **0** |
| errors | 0 | **0** |

Slug-suffix false positives fixed via **parent + name** match (`byParentAndName`) in importer.

Live: ~104 Woo categories (hierarchical), 459 READY products tagged with `_growmedica_taxonomy_*` meta.

---

## Redirect inventory (from frozen JSON)

| Metric | Value |
|--------|------:|
| Total 301 rules | **663** |
| Unique `fromPath` | 663 (0 multi-target collisions) |
| Self-redirects | 0 |
| Product rules | 464 |
| Category rules | 199 |
| `approved_merged_variant_redirect` | 9 |
| Source host in data | `growmedica.sk` only |

All source/target URLs in JSON are absolute `https://growmedica.sk/...`.  
**Policy:** implement **path-only** (host-independent). Never bake `.sk` host into Next redirects.

---

## ⚠️ CRITICAL: do not ship taxonomy target paths as-is

Taxonomy `settings` propose:

- `/{locale}/produkty/{slug}`
- `/{locale}/kategorie/{hierarchicalPath}`

**Current Next storefront reality:**

| Exists now | Does **not** exist as route |
|------------|-------------------------------|
| `/produkty/[handle]` | `/sk/produkty/...` as primary product route |
| `/kolekcie/[handle]` | `/kategorie/...` hierarchy routes |
| locale via cookie / `?lang=` | full path-locale taxonomy tree |
| legacy redirects already in `next.config.ts` (`/sk/produkt`, `/sk/kategoria`, …) | 663 bulk SEO map |

If Codex dumps JSON targets into `next.config` **without adapter**, category targets → **404** and product targets under `/sk/produkty/` are weaker than existing `/produkty/:slug` pattern.

### Recommended destination adapter (storefront www)

| Taxonomy target | Adapter destination (v1) |
|-----------------|---------------------------|
| `/sk/produkty/{handle}` | `/produkty/{handle}` |
| `/cs|/en|/de/produkty/{handle}` | `/produkty/{handle}?lang={locale}` **or** same path + locale cookie (match existing i18n) |
| `/sk/kategorie/{path}` | **Defer** until category routes exist **or** map leaf → existing `/kolekcie/{slug}` where handle exists |
| HOLD product target | skip / no public 301 that invents a PDP |

Product handles in redirect targets: **457/458** in READY; **1** is HOLD  
`bio-polyporus-prasok-100g-odvodhuje-organizmus` — **do not** create a public PDP redirect to a non-import product without decision.

---

## Suggested implementation order (redirects)

1. **Generate** `reports/seo-taxonomy/redirects.path.json`  
   `{ sourcePath, destinationPath, statusCode, objectType, objectId }` only.
2. **Product phase only** (safe, matches existing app routes):
   - source: legacy `/sk/hlavna-stranka/.../produkt/{old}/...` paths from JSON  
   - dest: `/produkty/{stableHandle}` for READY handles  
   - include 9 many-to-one `approved_merged_variant_redirect`
3. **Wire** into `next.config.ts` `redirects()` **or** a generated module imported there (keep file size sane).
4. **Do not** deploy category `/kategorie/*` targets until storefront has those pages or a explicit map to `/kolekcie/*`.
5. Smoke: 10 product old URLs → 301 → 200 on `/produkty/...`.

---

## Files prepared for speed

| File | Purpose |
|------|---------|
| `REDIRECT_PLAN.json` | counts + policy + samples |
| `REDIRECT_HANDOFF.md` | this file |
| `FREEZE.json` | taxonomy lock still in force |

## Out of scope until human OK

- Live WP redirect plugin mass-install  
- DNS / multi-domain host rules for `.sk` → `.cz` (infra, not only Next paths)  
- Re-running live taxonomy write
